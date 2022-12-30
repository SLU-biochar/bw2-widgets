**License** [![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]


# bw2-widget

 Convert a simple parametrized bw2 model to an interactive javascript widget, for simple inclusion in a website or visualisation in a standalone html file.

The widgets are meant to provide interactive visualisation of LCA results and the influence of the parameters to stakeholders, but should not be used to 'perform' an LCA study.

![Demo GIF](demo-gif-lq.gif)


## Dependencies & assumptions on bw2 project

Package dependencies, mainly: 
- brightway2 https://github.com/brightway-lca/brightway2 
- lca_algebraic https://github.com/oie-mines-paristech/lca_algebraic
- activity-browser https://github.com/LCA-ActivityBrowser/activity-browser 
(not tested for more recent versions, but can work or can be adapted to work)


HTML visualisation depend on:
- d3js v6 or v7 (compatible with both, as far as I checked)

Available charts:
- waterfall chart, updated from https://github.com/pjamesjoyce/lcopt
- stacked bar chart

## Workflow

* Step 1. Build your LCA model with project-level parameters, as you would normally do

* Step 2. In the notebook CreateWidgets.ipynb, use the provided functions to “tag” activities in your LCA model for the contribution analysis.

* Step 3. In the notebook CreateWidgets.ipynb, use the provided functions to convert the LCA model into a set of algebraic equations & an set-up an Excel file for parameter ranges.

* Step 4. In the notebook CreateWidgets.ipynb, use the provided functions to generates the HTML and JS files. 

* Step 5. Integrate to your website or share the widget with colleagues during project work.


## Possible contributions
- Inclusion in activity-browser

- new plot types, in d3js 
- option for multiple impact categories
- add sobol-simplified models
- add parameter order (custom or by importance)
- shift from .js file to a .json file export
...


## LICENSE

[![CC BY-SA 4.0][cc-by-sa-shield]][cc-by-sa]

This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License][cc-by-sa].

[![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]

[cc-by-sa]: http://creativecommons.org/licenses/by-sa/4.0/
[cc-by-sa-image]: https://licensebuttons.net/l/by-sa/4.0/88x31.png
[cc-by-sa-shield]: https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg
Attribution-ShareAlike 4.0 International