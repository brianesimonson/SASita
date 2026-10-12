/* Unbalanced two-factor example from the supplied SAS GLM manual, pp. 2989–2990.
   All four cells are present. /SOLUTION is a MODEL option, not a statement.
   Inspect glm_tests (HypothesisType=1 or 3), glm_parameters and glm_scored. */
data glm_study;
    length a $2 b $2;
    a='A1'; b='B1'; y=12; output;
    a='A1'; b='B1'; y=14; output;
    a='A1'; b='B2'; y=11; output;
    a='A1'; b='B2'; y=9; output;
    a='A2'; b='B1'; y=20; output;
    a='A2'; b='B1'; y=18; output;
    a='A2'; b='B2'; y=17; output;
run;
ods output OverallANOVA=glm_anova ModelANOVA=glm_tests
    ParameterEstimates=glm_parameters FitStatistics=glm_fit;
proc glm data=glm_study;
    class a b;
    model y=a|b / solution;
    output out=glm_scored p=predicted r=residual;
run;
quit;
ods output close;
