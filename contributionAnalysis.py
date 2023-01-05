import brightway2 as bw2
from bw2data.parameters import ActivityParameter, ProjectParameter, DatabaseParameter, Group
import lca_algebraic as la
from sympy.parsing.sympy_parser import parse_expr
from collections import defaultdict, OrderedDict
import sympy as sp
import numpy as np
import pandas as pd
from os.path import isfile

def getAllSymbols(aggraf):
    '''
    Get all the symbols from an aggregated graph (defaultdict) produced by 'multi_algebraic_traverse_tagged_databases'
    Returns a list from the set.
    '''
    allSymbols = set()
    for key in aggraf.keys():
        for expr in aggraf[key]:
            if isinstance(expr, sp.Expr):
                allSymbols = allSymbols.union(expr.free_symbols)
    return list(allSymbols)
    
def getParamsFromSymbols(allSymbols):
    '''
    Takes a list of symbols and retrieves their parameters properties in a nice dataframe from bw2
    '''
    ddf = pd.DataFrame({})
    c=0
    allSymbolsName = [xxx.name for xxx in allSymbols]
    for bwParam in ProjectParameter.select():
        if bwParam.name in allSymbolsName:
            df = pd.DataFrame(bwParam.dict,index=[0])
            ddf = pd.concat([ddf, df]) #ddf.append(df)
    ddf.reset_index(inplace=True, drop=True)
    return ddf

def genJSvariables(allSymbolsDF):
    '''
    Returns a string containing a javascript initisalisation of all the variables with their default values
    '''
    js_text = ''
    for rowtpl in allSymbolsDF.iterrows():
        row = rowtpl[1]
        if isinstance(row['amount'], str):
            js_text += 'var '+str(row['name'])+ ' = "'+ str(row['amount']) + '"; '
        else:
            js_text += 'var '+str(row['name'])+ ' = '+ str(row['amount']) + '; '
    return js_text

def getSwitchParams(df, prefix, alternatives):
    '''
    Separate switch parameters based on list of prefix
    Reprocess them, and returns two dfs: conventional parameters, and switch parameters
    '''
    if len(prefix)>0:
        #df2 = df[df['name'].str.contains('|'.join(prefix))]
        df1 = df[~df['name'].str.contains('|'.join(prefix))]
        df1 = df1.append(pd.DataFrame({'name': prefix,
                        'amount': [alternatives[xxx]['options'][0] for xxx in alternatives],
                        'group': ['']*len(prefix),
                        'label': ['']*len(prefix),
                        'description':['Switch parameter for '+pref for pref in prefix],
                        'uncertainty type':['switch']*len(prefix),
                        'minimum': [0]*len(prefix),
                        'maximum': [1]*len(prefix),
                        'loc':['']*len(prefix),
                }), ignore_index=True)
        # in case there are nan or none in the python object, javascript would not like it, 
        df1.fillna(value='', inplace=True)
    else:
        df1 = df
    return df1

def write_widget(widget_filename, jsstr_param, jsstr_switchparam, jstr_paraminit, jstr_algeabraicfunc):
    '''Write a javascript file with the data needed to display the widget, i.e.
    1) the parameter_data, as a df.to_dict in var parameter_data
    2) the additional data for switch parameters, in var switch_parameter_data
    3) initalise the parameter values
    4) a function for the algebraic calculations
    
    '''
    with open(widget_filename, 'w') as file: # w:write, a:append
        # parameter data
        file.write("// var parameter_data & var switch_parameter_data contains the data describing the parameters of the LCA model \n")
        file.write("var parameter_data = ")
        file.write(jsstr_param)
        file.write("; \n")
        file.write("var switch_parameter_data = ")
        file.write(jsstr_switchparam)
        file.write("; \n")
        file.write("// Definition of the javacsript parameters, and set to default values \n")
        file.write(jstr_paraminit)
        file.write("\n")
        file.write("// Algebraic function for updating figure \n")
        file.write("function algebraic_equation_f(){ \n ")
        file.write("return [ ")        
        file.write(jstr_algeabraicfunc)
        file.write(" ]; ")  
        file.write(" \n} \n")
    
    print("File created in: "+widget_filename)

def reorderContributions(agg_res, contribution_oder):
    '''
    Uses an OrderedDict to re-order contributions based on list given, and returns a dict
    Only if the key exist in the initial dictionary
    '''
    agg_res = OrderedDict(agg_res)
    for key in contribution_oder:
        if key in agg_res:
            agg_res.move_to_end(key, True)
    return dict(agg_res)
    
# Update the default uncertainty on all ProjectParameters to match with lca_algebraic
def convertUndefinedUncertainty():
    '''
    Converts the undefined uncertainty type of project parameters in a given project as follow:
    '' ---> 1 as per stats array
    Rationale:
    parameters created in AB dev without uncertainty have the value '' which is not supported by lca_agebraic,
    as lca_algebraic follows now stas_array, with a '1' for 'fixed parameter value
    '''
    c=0
    for param in ProjectParameter.select():
        if(param.data['uncertainty type'] == ''):
            param.data['uncertainty type'] = 1
            c+=1
            param.save()
    print('Parameters modified: {}'.format(c))  
    
def mergeRelinkDatabases(name_of_bw_project, merge_in = '', to_merge = [],
                         bg_dbs = ['ei_cutoff_36', 'ei_csq_36', 'ei_apos_36'],
                         deleteMergedOnes=False):
    '''
    Merges together a set of foreground databases into a new foreground database, 
    relink the activities internally,
    and relink remaining databases to the new database
    Optionally, deregisters the foreground databases that have been merged.
    '''
    bw2.projects.set_current(name_of_bw_project)
    print("Current project is {}".format(bw2.projects.current))

    if merge_in not in bw2.databases:
        bw2.Database(merge_in).register()

    # copy all activities in a merged database
    counter = 0
    for db in to_merge:
        for a in bw2.Database(db):
            if a not in bw2.Database(merge_in):
                a.copy(code=a['code'], database=merge_in) # copies everything, including tags, comments, etc
                counter+=1
    print("Copied {} activities to the new database '{}' ".format(counter, merge_in) )


    # modify all the exchanges in the merged database, so they link to internal activities
    for old_db in to_merge:
        print("Relinking for db {}".format(old_db))
        if old_db == merge_in:
            print("No point relinking to same database.")
            break

        db = bw2.Database(merge_in)
        other = bw2.Database(old_db)
        assert db.backend == "sqlite", "Relinking only allowed for SQLITE backends"
        assert other.backend == "sqlite", "Relinking only allowed for SQLITE backends"

        # find dupplicates & candidates between old & new database
        duplicates, candidates = {}, {}
        altered = 0
        for ds in db: # for activities in new database
            # key = activity_hash(ds, DEFAULT_FIELDS) # creates a hash based on default field of activity # to avoid
            key = ds.key[1] # because I have simply copied them, and they may have _copy1 extensions
            if key in candidates: # candidates is empty at first
                duplicates.setdefault(key, []).append(ds)
            else:
                candidates[key] = ds.key # key is just a hash, ds.key is (code, hash)

        # traverse all the activities and their technosphere/biosphere exchanges, for changing the exchanges
        for i, exc in enumerate(
                            exc for act in db for exc in act.exchanges()
                            if exc.get("type") in {"biosphere", "technosphere"} and exc.input[0] == old_db
                    ):
                        # Use the input activity to generate the hash.
                        key = exc.input.key[1] #activity_hash(exc.input, DEFAULT_FIELDS)
                        if key in duplicates:
                            raise StrategyError(format_nonunique_key_error(exc.input, DEFAULT_FIELDS, duplicates[key]))
                        elif key in candidates:
                            if(exc["input"] in [ ('biomass', 'f5f25b0061ab48eb80b09da962e5b72a_copy2'),
                                                ('biomass', 'f5f25b0061ab48eb80b09da962e5b72a'),
                                                ('biomass', '9874381134524181be77b63842815313_copy4'),

                            ]):
                                print('HERE')
                                print('We modify: ')
                                print(exc["input"])
                                print('TO:')
                                print(candidates[key])
                            exc["input"] = candidates[key]
                            altered += 1
                        exc.save()
        print('-- {} exchanges were modified'.format(altered))

        db.process()
        print(
            "Relinked database '{}', {} exchange inputs changed from '{}' to '{}'.".format(
                db.name, altered, other.name, db.name
            )
        )
    all_dbs = set(bw2.databases)
    other_fgdb = all_dbs - set(to_merge) - set(bg_dbs) - set(merge_in) # remaining dbs
    other_fgdb = list(other_fgdb)
    print("Relinking the remaning databases:")
    print(other_fgdb)
    
    for fg_db in other_fgdb:
        fg_db = bw2.Database(fg_db) # the db to relink
        new_db = bw2.Database(merge_in) # new db

        for old_db in to_merge:
            old_db = bw2.Database(old_db) # old db

            # find dupplicates & candidates between old & new database
            duplicates, candidates = {}, {}
            altered = 0
            for ds in new_db: # for activities in new database
                # key = activity_hash(ds, DEFAULT_FIELDS) # creates a hash based on default field of activity # to avoid
                key = ds.key[1] # because I have simply copied them, and they may have _copy1 extensions
                if key in candidates: # candidates is empty at first
                    duplicates.setdefault(key, []).append(ds)
                else:
                    candidates[key] = ds.key # key is just a hash, ds.key is (code, hash)

            # traverse all the activities and their technosphere/biosphere exchanges, for changing the exchanges
            for i, exc in enumerate(
                                exc for act in fg_db for exc in act.exchanges()
                                if exc.get("type") in {"biosphere", "technosphere"} and exc.input[0] == old_db.name
                        ):
                            # Use the input activity to generate the hash.
                            key = exc.input.key[1] 
                            if key in duplicates:
                                raise StrategyError(format_nonunique_key_error(exc.input, DEFAULT_FIELDS, duplicates[key]))
                            elif key in candidates:
                                exc["input"] = candidates[key]
                                altered += 1
                            exc.save()

            fg_db.process()
            print(
                "Relinked database '{}', {} exchange inputs changed from '{}' to '{}'.".format(
                    fg_db.name, altered, old_db.name, new_db.name
                )
            )
            
    if deleteMergedOnes:
        for old_db in to_merge:
            bw2.Database(old_db).deregister()


def setupProject4Widget(prj, fgdb, to_merge=[], bg_dbs=[], deleteMergedOnes=False):
    '''
    A wrap function to: 
        - set current project, if it exist otherwise break 
        - parse bw2 project parameters as lca_algebraic parameters, and persit them
        - convertUndefinedUncertainty type (due to bw2/ab versions clash, in some cases)
        - merge
    '''
    if prj not in bw2.projects:
        print('Project does not exist. Please select a project that exist.')
        print(bw2.projects)
        raise Exception("Project does not exist") 
    else:
        print('The project exists, setting it as current project')
        bw2.projects.set_current(prj)

    ## TO DO hide warnings... or edit lca_algebraic
    # loadParams from bw2 to lca_algebraic dic
    la.loadParams(global_variable=True, dbname=None)
    # persitParams from lca_algebraic dic to bw2
    la.persistParams()    
    convertUndefinedUncertainty()
    if fgdb not in bw2.databases:
        mergeRelinkDatabases(prj, merge_in = fgdb, to_merge = to_merge, bg_dbs = bg_dbs, deleteMergedOnes=deleteMergedOnes)
    else:
        print("Database %s already existing. No merging/relinking performed." %(fgdb) )
    # need to set the foreground db in lca_algebraic, otherwise considers we reach the background db
    la.setForeground('foreground')

    print("bw2 project ready for creation of widgets.")
    print("Proceed to next section")


## contribution analysis functions, adapted for lca_agebraic, with multiple impact categories & tags
def runAlgebraicGraphTraversal(fus, methods, label="tag", default_tag="other", secondary_tags=[],
    fg_databases=None, bio2tech=False, parent4other=False
):
    '''
    Loop around multi_algebraic_traverse_tagged_databases, to perform analysis for multiple functional units at once.
    - fus : a list of fu dictionaries or a single fu dict
    - methods: a list of method tuples
    - label: name of label for grouping
    '''
    all_graphs = {}
    if(not isinstance(fus, list)):
        fus = [fus]
    for fu in fus:
        agg_graph, graph = multi_algebraic_traverse_tagged_databases(fu, methods, label, default_tag, secondary_tags, fg_databases, bio2tech, parent4other)
        all_graphs[next(iter(fu))] = {'agg_graph': agg_graph, 'graph': graph}
    return all_graphs

def multi_algebraic_traverse_tagged_databases(
    functional_unit, methods, label="tag", default_tag="other", secondary_tags=[],
    fg_databases=None, bio2tech=False, parent4other=False
):
    # is this really needed?
    lca = bw2.LCA(functional_unit, methods[0])
    lca.lci(factorize=True)
    lca.lcia()
    ###
    
    method_dicts = [{o[0]: o[1] for o in bw2.Method(method).load()} for method in methods]
    graph = [multi_algebraic_recurse_tagged_database(key, amount, methods, method_dicts, lca, label, default_tag, secondary_tags, fg_databases, parent4other)
             for key, amount in functional_unit.items()]
             
    return multi_algebraic_aggregate_tagged_graph(graph, bio2tech), graph
    
def multi_algebraic_aggregate_tagged_graph(graph, bio2tech=False):
    """Aggregate a graph produced by ``recurse_tagged_database`` by the provided tags.
    Outputs a dictionary with keys of tags and numeric values.  
    If bio2tech is set to True, then biosphere exchanges are added to the tag of the parent activity (instead of direct emissions)
    .. code-block:: python
        {'a tag': summed LCIA scores}

    """

    def recursor(obj, scores):
        if not scores.get(obj['tag']):
            scores[obj['tag']] = [x for x in obj['impact']]
        else:
            scores[obj['tag']] = [sum(x) for x in zip(scores[obj['tag']], obj['impact'])]
        
        if bio2tech:
            for flow in obj["biosphere"]:
                if not scores.get(flow['tag']):
                    scores[obj["tag"]] = [x for x in flow["impact"] ] 
                else:
                    scores[obj["tag"]] = [sum(x) for x in zip(scores[flow['tag']], flow['impact'])]
                    
        else: # default behavior
            for flow in obj["biosphere"]:
                if not scores.get(flow['tag']):
                    scores[flow['tag']] = [x for x in flow['impact']]
                else:
                    scores[flow['tag']] = [sum(x) for x in zip(scores[flow['tag']], flow['impact'])]
        
        for exc in obj["technosphere"]:
            scores = recursor(exc, scores)
            
        return scores

    scores = defaultdict(int)
    for obj in graph:
        scores = recursor(obj, scores)
    return scores


def _getAmountOrFormula(ex):
    """ Return either a fixed float value or an expression for the amount of this exchange"""
    if 'formula' in ex:
        if not 'CORINE' in ex['formula']:
            try:
                return parse_expr(ex['formula'])
            except:
                error("Error while parsing formula '%s' : backing to amount" % ex['formula'])
    return ex['amount']

def multi_algebraic_recurse_tagged_database(
    activity, amount, methods, method_dicts, lca,
    label, default_tag, secondary_tags=[], fg_databases=None, parent4other=False
):
    if isinstance(activity, tuple):
        activity = bw2.get_activity(activity)
        
    if fg_databases == None: # then set the list equal to the database of the functional unit 
        fg_databases = [activity['database']] # list, single item
    elif fg_databases == list(bw2.Database(activity['database']).find_graph_dependents()): 
        # check that the list fg_databases does not include all the databases involved in the FU 
        # (otherwise, it would mean we are likely to have to recurse through ecoinvent... not funny)
        # ideally, should only on first call of recurse_tagged_database
        raise Exception('The list of databases to traverse fg_databases should not be equal to the all databases involved in the project. You risk to attempt to traverse a background database like ecoinvent - it would take too much time')

    inputs = list(activity.technosphere())  
    production = list(activity.production())
    if len(production) == 1:
        scale = production[0]["amount"]
    elif not production:
        # Assume production amount of 1
        scale = 1
    else:
        raise ValueError("Can't scale by production exchange")

    inside = [exc for exc in inputs if exc["input"][0] in fg_databases] # inside = activities in fg_databases
    
    
    outside_exch = []
    for exc in inputs:
        if exc["input"][0] not in fg_databases:
            outside_exch.append(
                {'exch': exc["input"],
                 'formula': _getAmountOrFormula(exc) / scale * amount,
                 'EFs': []}
            )
    
    outside_scores = [0]*len(methods) 
    if outside_exch:
        for out in outside_exch:
            for n,m in enumerate(methods):
                #print("Switching to method ", n)
                lca.switch_method(m)
                lca.redo_lcia( {out['exch']:1} )
                out['EFs'].append(lca.score)
        
        for i,m in enumerate(methods):
            outside_scores[i] = 0
            for out in outside_exch:
                outside_scores[i] += out['EFs'][i]*out['formula']
    else:
        outside_scores = [0]*len(methods)

    ## To be more efficient in outside_scores calculation:
    ## save background EFs and cache them
    ## for each method
    ## calc background impacts
#    def _multiLCA(activities, methods):
#        """Simple wrapper around brightway API"""
#        bw2.calculation_setups['process'] = {'inv': activities, 'ia': methods}
#        lca = bw2.MultiLCA('process')
#        
#        cols = [act for act_amount in activities for act, amount in act_amount.items()]
#        return pd.DataFrame(lca.results.T, index=[method_name(method) for method in methods], columns=cols)
#
#    bg_lca = _multiLCA(bg_act_fu, methods) # returns a df
#    # convert df to a nice useable dictionary here         
#    bg_scores = {}
#    for imethod, method in enumerate(methods) :
#        for iact, act in enumerate(bg_act_fu) :
#            col = self.A_NS_columns[list(act)[0]]
#            bg_scores[(col, list(act)[0], method)] = bg_lca.iloc[imethod, iact]
#            
#            EFs[imethod, col] = bg_lca.iloc[imethod, iact]


    if parent4other:
        #if this option is set to True, will change default_tag's value to the tag
        # of the parent activity if itself was not empty 
        if activity.get(label) != None:
            default_tag = activity.get(label)
    
   # if default_tag == 'Other':
   #    print(default_tag, amount, activity, outside_scores)
   # for exc in activity.biosphere():
   #     print(exc)
   #     print(_getAmountOrFormula(exc))
   #     print([_getAmountOrFormula(exc) / scale
   #             * amount
   #             * method_dict.get(exc["input"], 0) for method_dict in method_dicts]
   #             )
        
    return {
        "activity": activity,
        "amount": amount,
        "tag": activity.get(label) or default_tag,
        "secondary_tags": [activity.get(t[0]) or t[1] for t in secondary_tags],
        "impact": outside_scores, ## ESA
        "biosphere": [
            {
                "amount": _getAmountOrFormula(exc) / scale * amount,
                "impact": [ _getAmountOrFormula(exc)
                / scale
                * amount
                * method_dict.get(exc["input"], 0) for method_dict in method_dicts],
                "tag": exc.get(label) or activity.get(label) or default_tag,
                "secondary_tags": [
                    exc.get(t[0]) or activity.get(t[0]) or t[1] for t in secondary_tags
                ],
            }
            for exc in activity.biosphere()
        ],
        "technosphere": [
            multi_algebraic_recurse_tagged_database(
                exc.input,
                _getAmountOrFormula(exc) / scale * amount,
                methods,
                method_dicts,
                lca,
                label,
                default_tag,
                secondary_tags,
                fg_databases,
                parent4other
            )
            for exc in inside
        ],
    }