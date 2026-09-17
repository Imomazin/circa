# Methodology v0.1

The implementation is authoritative in `lib/scoring/commercial.ts`. Every score is rounded to a whole number between 0 and 100. Components are bounded before weighted aggregation. All weights sum to one and are exposed in the interface.

Commercial viability: incremental economics 35%, customer demand 25%, capital payback 20%, delivery readiness 20%.

Commercial resilience: supplier diversity 15%, import independence 10%, cost stability 10%, substitution 10%, repair/reuse 15%, revenue diversity 10%, recurring income 10%, retention 10%, operating flexibility 10%.

Investor readiness: customer/market evidence 20%, unit economics 20%, management/delivery 15%, scale/traction 15%, capital clarity 10%, resource security 10%, data quality 10%.

Circular opportunity: reuse potential 35%, repairability 25%, material expenditure reduction 25%, resource security 15%. Expenditure reduction is a commercial proxy, not a physical material-flow measure.

Evidence confidence: declared source quality 50%, customer validation 30%, trading evidence 20%.

Economics component: non-positive incremental contribution scores 10; positive uplift scores `35 + 300 * uplift / max(baseline revenue, 1)`, bounded to 100. Payback component: `100 - 1.2 * months`, bounded; absent payback scores zero. Recurring income: recurring revenue divided by circular revenue, multiplied by 250 and bounded. A 40% recurring share reaches 100. Capital clarity is 75 when capex is specified above zero and 35 otherwise; this is a deliberately limited heuristic.

Bands: strong 75+, developing 55–74, needs evidence 35–54, high uncertainty below 35. The confidence label attached to a score uses declared source quality: higher 75+, moderate 45–74, limited below 45. None of these values is a probability.

Positive drivers are the two highest components. Weaknesses are components below 60. Missing evidence rules identify customer commitments, market comparison, trading results and source documents. These rules need co-design and external validation.
