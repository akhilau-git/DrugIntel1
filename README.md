# DrugIntel: End-to-End Digital Twin of the Pharmaceutical Pipeline

DrugIntel is an enterprise-grade platform that digitally simulates the entire lifecycle of a medication for high-stakes diseases (Cardiovascular, Diabetes, Cancer, Autoimmune, Mental Health, and Epilepsy). 

Instead of just predicting if two drugs interact, your platform:
* **Clinically:** Predicts how single drugs, pairs, or complex multi-drug cocktails (polypharmacy) will interact inside the human body over a 24-hour period.
* **In the Lab:** Digitally simulates wet-lab tests like Thin Layer Chromatography (TLC) and calculates molecular shelf-life.
* **In the Factory:** Simulates manufacturing conditions to predict optimal chemical yields for mass production.

## The AI, ML, and DL Models Used

We utilize a state-of-the-art **"Ensemble Architecture,"** combining Deep Learning (DL), traditional Machine Learning (ML), and Explainable AI (xAI).

### Deep Learning (Graph & Geometric AI)
* **IBGCN (Information Bottleneck Graph Convolutional Network):** Acts as a "Speed Filter." Drops noisy, irrelevant atoms from molecular graphs so the real-time system doesn't crash from heavy computation.
* **MGKAN (Multimodal Graph Kolmogorov-Arnold Network):** Calculates Asymmetric Pairwise DDI. It predicts mechanism-specific interactions (e.g., Drug A blocks the metabolism of Drug B).
* **HGNN (Hypergraph Neural Network):** The Polypharmacy engine. Uses "hyperedges" to encircle 3-5 drugs at once to predict cascading toxicities in complex treatments.

### Deep Learning (Transformers)
* **ChemBERTa-2 (NLP Transformer):** Reads 1D molecular SMILES strings like a language to catch hidden chemical syntax patterns that 2D graphs might miss.
* **PatchTST (Time-Series Transformer):** Acts as the Pharmacokinetics simulator. Looks at a 24-hour window and predicts the exact hour that overlapping drug concentrations become dangerously toxic.

### Machine Learning (Traditional & Tree-Based)
* **Gradient Boosting Classifier:** Used in the Drug-Drug Interaction (DDI) Model to classify severity.
* **Random Forest Regressor:** Used in the TLC Simulator to predict Retardation factor ($R_f$) based on solvent polarity.
* **XGBoost (Extreme Gradient Boosting):** The king of tabular data, utilized to predict precise industrial manufacturing yields (temperature, pressure, catalyst volume) for scaling production.

### Explainable AI (xAI)
* **SHAP & GNNExplainer:** The trust layer. When a toxicity warning fires, these highlight the exact 3D molecular functional group causing the issue, so human experts can verify the logic.

## What Your Project Achieves (The "Extraordinary" Impact)

By combining these models into one unified Pharma Intelligence Hub, your project achieves five major industry milestones:

1. **Eliminates the "Polypharmacy Blind Spot":** Safely maps out treatments for patients taking 5+ medications simultaneously.
2. **Massive Cost and Time Reduction:** Simulates TLC plates and manufacturing yields in-silico, skipping months of expensive physical wet-lab testing.
3. **Data-Driven "Go/No-Go" Decisions:** Gives decision-makers a single holistic score.
4. **Audit-Ready Regulatory Compliance:** Uses GNNExplainer and SHAP to ensure the AI isn't a "black box," generating transparent reports required by the FDA.
5. **Enterprise-Grade Safety & Security:** Protects patient safety while securing multi-billion-dollar corporate IP via strict Role-Based Access Control (RBAC).
