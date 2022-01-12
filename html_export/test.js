var x = {'Biomass production': [0.102709573774247/wls_y_bc],
 'Pyrolysis': [4.50131762277986e-5*mrg_el_1*mrg_el_2*wls_q_w + 0.360105409822389*mrg_el_1*mrg_el_2*(1.0*wls_e_d*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc + 1.0*wls_i_el + 1.0*wls_i_elp) + 2.42794082844203e-5*mrg_el_1*mrg_el_3*wls_q_w + 0.194235266275362*mrg_el_1*mrg_el_3*(1.0*wls_e_d*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc + 1.0*wls_i_el + 1.0*wls_i_elp) + 6.6652725120014e-6*mrg_el_2*mrg_el_3*wls_q_w + 0.0533221800960112*mrg_el_2*mrg_el_3*(1.0*wls_e_d*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc + 1.0*wls_i_el + 1.0*wls_i_elp) + 3.62883781278726*wls_i_f + 1.59311740463577e-5*wls_q_w],
 'Transport': [0.000270233776960766*dist2bio_wl*mrg_fuel_1/wls_y_bc + 0.000145364790015465*dist2bio_wl*mrg_fuel_2/wls_y_bc + 5.41228275961133e-5*dist2bio_wl/wls_y_bc + 0.000158961045271039*dist2proc*mrg_fuel_1 + 8.55087000090971e-5*dist2proc*mrg_fuel_2 + 3.18369574094784e-5*dist2proc + 0.00043819706277242*mrg_fuel_1 + 0.00024471943149329*mrg_fuel_2 + 0.000117464291315068],
 'RLBU': [0.0923633541143684/wls_y_bc],
 'Reactor': [0.009167053954448666],
 'other': [0],
 'C-sink': [-3.66666666666667*bc_C_7],
 'Energy substitution': [
 // energy subs 
     0.0018770494486992*mrg_el_1*mrg_el_2* mrg_heat_2*mrg_heat_3*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc) 
// above, it's case for: el = 3 = ng, and heat = 1 = forest
 +  0.00101245132546033*mrg_el_1*mrg_el_3* mrg_heat_2*mrg_heat_3*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc) 
// above, it's case for: el = 2 = something, and heat = 1 = forest
 + 0.000277941863750458*mrg_el_2*mrg_el_3* mrg_heat_2*mrg_heat_3*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc) 
// above, it's case for: el = 1 = something, and heat = 1 = forest
 
 +   0.0683306940143783*mrg_heat_1*mrg_heat_2*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc) 
// above, it's case for: el = ?? = something, and heat = 3 = ng

 +   0.0929004241862229*mrg_heat_1*mrg_heat_3*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc) 
// above, it's case for: el = 1 = something, and heat = 2 = oil

 +  0.00122103171317999*mrg_heat_2*mrg_heat_3*(-1.0*wls_eta_h*(-wls_LHV_bc_dry + wls_LHV_bio_dry/wls_y_bc + 3.6*wls_i_el) + 1.0*wls_h_d*(1 - wls_r_d)*(-1/(1 - wls_w_d) + 1/(1 - wls_w))/wls_y_bc)
// above, it's case for: el = 1 = something, and heat = 1 = forest
 
 ]}