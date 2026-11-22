# FOODLOOP AI — Machine Learning Methodology & Demand Forecasting

## 1. Objective Definition

The primary forecasting task is formulated as:
$$\hat{y}_{p, t+h} = f(\mathbf{x}_{p, t})$$
Where:
- $p$: Specific food product identifier.
- $t$: Current decision timestamp (end of business day $t$).
- $h$: Forecast horizon (default $h=1$ day for next-day demand).
- $\hat{y}_{p, t+h}$: Predicted demand (units sold) for product $p$ on day $t+h$.
- $\mathbf{x}_{p, t}$: Feature vector containing only historical information observed up to day $t$.

---

## 2. Feature Engineering & Strict Anti-Leakage Constraints

### Strict Rules to Prevent Future-Data Leakage:
1. **Chronological Splitting Only**: Never use randomized train/test splits (`train_test_split(shuffle=True)` is prohibited for time series).
2. **Lag Features**: All rolling statistics and lags are shifted by at least $h$ steps:
   - `lag_1`: Sales at $t$
   - `lag_7`: Sales at $t-6$ (same day of week previous week)
   - `lag_14`: Sales at $t-13$
   - `rolling_mean_7`: Mean sales over $[t-6, t]$
   - `rolling_std_7`: Standard deviation of sales over $[t-6, t]$
   - `rolling_mean_14`: Mean sales over $[t-13, t]$
3. **Calendar Features**:
   - `day_of_week` (0 to 6, cyclic or one-hot encoded)
   - `is_weekend` (binary 0 or 1)
   - `month` (1 to 12)
   - `day_of_month` (1 to 31)
4. **No Future Targets**: Under no circumstances may target values at $t+1$ be referenced in input features.

---

## 3. Baselines & Candidate Model Architectures

### 3.1 Baselines
1. **Naive Baseline (Previous Period)**:
   $$\hat{y}_{t+1}^{\text{naive}} = y_t$$
2. **Weekly Seasonal Naive (7-day Lag)**:
   $$\hat{y}_{t+1}^{\text{snaive}} = y_{t-6}$$
3. **7-Day Moving Average Baseline**:
   $$\hat{y}_{t+1}^{\text{MA7}} = \frac{1}{7} \sum_{i=0}^{6} y_{t-i}$$

### 3.2 Candidate ML Models
1. **HistGradientBoostingRegressor (scikit-learn)**:
   - High efficiency on tabular data with natural support for missing values and monotonic constraints.
2. **RandomForestRegressor (scikit-learn)**:
   - Robust non-linear ensemble, less sensitive to hyperparameter tuning, resistant to overfitting on small seller datasets.

---

## 4. Evaluation Metrics

Models are evaluated on the held-out out-of-sample chronological test split using four standard industry metrics:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |y_i - \hat{y}_i|$$
2. **Root Mean Squared Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2}$$
3. **Weighted Absolute Percentage Error (WAPE)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^{N} |y_i - \hat{y}_i|}{\sum_{i=1}^{N} y_i}$$
   *(Preferred over MAPE to avoid division-by-zero on low-volume days)*.
4. **Forecast Bias (Mean Error)**:
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (\hat{y}_i - y_i)$$
   *(Positive bias indicates consistent over-prediction, leading to surplus; negative bias indicates under-prediction, leading to stockouts)*.

---

## 5. Seller Cold-Start & Hierarchical Fallback Policy

To ensure transparency and prevent deceptive predictions for brand new sellers:

| History Available | Strategy | UI Method Label |
| :--- | :--- | :--- |
| **0 - 6 days** | Insufficient history for reliable forecast. Prompt seller to log daily sales or import template. | `INSUFFICIENT_HISTORY` |
| **7 - 20 days** | 7-day Moving Average or Day-of-Week Naive baseline. | `STATISTICAL_BASELINE_MA7` |
| **21 - 59 days** | Seller-calibrated baseline with trend adjustment. | `SELLER_CALIBRATED_BASELINE` |
| **60+ days** | Full seller-specific ML model retrained on merchant records. | `SELLER_SPECIFIC_ML_MODEL` |

When a compatible benchmark model is used, the system explicitly labels:
`"Trained on Mendeley German Restaurant Benchmark (CC BY 4.0). Accuracy may vary for local menus."`
