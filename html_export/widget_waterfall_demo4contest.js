// var parameter_data & var switch_parameter_data contains the data describing the parameters of the LCA model 
var parameter_data = {'name': {0: 'p_a', 1: 'p_b', 2: 'p_be', 3: 'p_cem', 4: 'p_c', 5: 'p_e', 6: 'p_ee', 7: 'p_f', 8: 'p_d', 9: 'p_el', 10: 'p_al'}, 'amount': {0: 0.5, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5}, 'description': {0: 'hello world', 1: 'foo bar', 2: 'foo bar', 3: 'foo bar', 4: 'foo bar', 5: 'foo bar', 6: 'foo bar', 7: 'foo bar', 8: 'foo bar', 9: 'foo bar', 10: 'foo bar'}, 'uncertainty type': {0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4}, 'minimum': {0: 0.2, 1: 0.2, 2: 0.2, 3: 0.2, 4: 0.2, 5: 0.2, 6: 0.2, 7: 0.2, 8: 0.2, 9: 0.2, 10: 0.2}, 'maximum': {0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2}, 'loc': {0: 0.5, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5}, 'prettyName': {0: 'a', 1: 'b1', 2: 'b2', 3: 'cem', 4: 'c', 5: 'e1', 6: 'e2', 7: 'f', 8: 'd', 9: 'el', 10: 'al'}, 'unit': {0: 'kg', 1: 'kg', 2: 'kg', 3: 'kg', 4: 'kg', 5: 'kg', 6: 'kg', 7: 'kg', 8: 'kg', 9: 'kg', 10: 'kg'}}; 
var switch_parameter_data = {}; 
// Definition of the javacsript parameters, and set to default values 
var p_a = 0.5; var p_b = 0.5; var p_be = 0.5; var p_cem = 0.5; var p_c = 0.5; var p_e = 0.5; var p_ee = 0.5; var p_f = 0.5; var p_d = 0.5; var p_el = 0.5; var p_al = 0.5; 
// Algebraic function for updating figure 
function algebraic_equation_f(){ 
 return [ {'Step Alpha': 10*p_a*p_cem, 'Step Beta': -10*p_al*(10*p_b + p_be), 'Step Gamma': 5*p_a*p_c*p_el, 'All transport': 3*p_a*p_c*p_d + 3*p_a*p_e*p_ee + 3*p_f*(10*p_b + p_be), 'other': 0, 'group': 'FU'},  ];  
} 
