# Commercial model

Baseline contribution equals revenue less materials, labour, energy, maintenance and overheads. Circular revenue applies the entered percentage change to baseline revenue, then adds explicitly additional recurring revenue. The core revenue change must exclude that recurring stream.

Circular material expenditure applies material savings first and supplier-price shock second. Energy savings affect baseline energy expenditure. Additional labour and operating costs are deducted once.

Annual uplift is circular contribution minus baseline contribution. Initial cash requirement is capex plus additional working capital. Simple payback in months is initial cash requirement divided by annual uplift, multiplied by twelve. Non-positive uplift produces no payback. A zero initial cash requirement with positive uplift produces zero months.

Three-year opportunity value is three annual uplifts minus initial cash requirement plus residual value in year three. Residual value cannot exceed capex. Working capital is not released in this horizon. The chart compares cumulative baseline contribution with cumulative circular contribution after initial cash requirement and final residual value.

Excluded: tax, financing cost, depreciation, discounting, seasonality, ramp-up, inflation and terminal working-capital release. Retention influences resilience but does not automatically change revenue. The user must justify revenue assumptions separately. No financial advice or guaranteed return is implied.

The base, upside and downside are independently saved scenarios. Changing the base does not silently overwrite the other cases. Each has a revision, recalculation timestamp and explanatory scores. Concurrent edits use optimistic revision checks and return an HTTP 409 conflict.
