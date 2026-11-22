# FOODLOOP AI — Known Limitations & Assumptions

1. **Routing Provider Availability**:
   - The default routing provider uses the public OSRM demonstration server (`router.project-osrm.org`). While suitable for development and hackathon testing, this endpoint is rate-limited and provides no SLA. In production, a dedicated self-hosted OSRM container or commercial provider (Mapbox / OpenRouteService) should be configured.
2. **Third-Party POS Credentials**:
   - GoFrugal and Square connectors require merchant API keys and developer accounts. In the absence of live production credentials, the system marks them as `Not configured` and provides the universal Manual Cashier and Excel/CSV ingestion pipelines as fully functioning alternatives.
3. **Food Safety Review**:
   - The platform enforces configurable human safety check gates (temperature thresholds, expiry limits, condition ratings). The system does not independently verify physical bacterial counts or chemical safety; human verification by an authorized food handler remains mandatory.
4. **Public ML Benchmark Dataset**:
   - The primary baseline model uses the Mendeley Data Stuttgart Restaurant dataset (CC BY 4.0). While valid for demonstrating day-of-week demand variance, seasonal fluctuations, and regression algorithms, restaurant demand patterns vary significantly across geographies and cuisines. The system implements a hierarchical fallback to prioritize each seller's own historical data once sufficient records (60+ days) are accumulated.
5. **Cold-Start Data Requirements**:
   - Accurate statistical forecasts require at least 7 days of daily records for moving-average baselines, and 60+ days for machine learning regressors. New sellers are notified of history requirements rather than presented with fabricated forecasts.
6. **Carbon & Environmental Impact Assumptions**:
   - Environmental benefits are calculated strictly from confirmed delivery transactions using documented conversion factors (0.45 kg per standard meal portion; 2.5 kg CO₂e avoided per kg food rescued based on UNEP Food Waste Index methodology). These are clearly labeled as estimates derived from physical quantities.
