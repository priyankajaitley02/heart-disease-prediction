import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const initialValues = {
  fullName: "", age: "", sex: "", cp: "", trestbps: "", chol: "", fbs: "",
  restecg: "", thalch: "", exang: "", oldpeak: "", slope: "", ca: "", thal: "",
};

const selectOptions = {
  sex: ["Female", "Male"],
  cp: ["typical angina", "atypical angina", "non-anginal", "asymptomatic"],
  fbs: ["False", "True"],
  restecg: ["normal", "st-t abnormality", "lv hypertrophy"],
  exang: ["False", "True"],
  slope: ["upsloping", "flat", "downsloping"],
  thal: ["normal", "fixed defect", "reversible defect"],
};

const fieldDetails = {
  fullName: ["Full Name", "text", "Enter full name", { minLength: 2, maxLength: 120 }],
  age: ["Age", "number", "Years", { min: 1, max: 120, step: 1 }],
  sex: ["Sex", "select", "Select sex"],
  trestbps: ["Resting Blood Pressure", "number", "mm Hg", { min: 1, step: 1 }],
  chol: ["Cholesterol", "number", "mg/dL", { min: 1, step: 1 }],
  thalch: ["Maximum Heart Rate", "number", "bpm", { min: 1, step: 1 }],
  oldpeak: ["ST Depression", "number", "Value", { min: 0, step: 0.1 }],
  ca: ["Major Vessels", "number", "0 to 4", { min: 0, max: 4, step: 1 }],
  cp: ["Chest Pain Type", "select", "Select type"],
  fbs: ["Fasting Blood Sugar", "select", "Select value"],
  restecg: ["Resting ECG", "select", "Select result"],
  exang: ["Exercise Induced Angina", "select", "Select value"],
  slope: ["ST Slope", "select", "Select slope"],
  thal: ["Thalassemia", "select", "Select type"],
};

function Field({ name, values, onChange }) {
  const [label, type, hint, inputProps = {}] = fieldDetails[name];
  const id = `field-${name}`;
  return <div className="field">
    <label htmlFor={id}>{label}{name === "fullName" && <span aria-hidden="true"> *</span>}</label>
    {type === "select" ? <select id={id} name={name} value={values[name]} onChange={onChange} required>
      <option value="">{hint}</option>
      {selectOptions[name].map((option) => <option value={option} key={option}>{option}</option>)}
    </select> : type === "text" ? <input id={id} name={name} type="text" value={values[name]} onChange={onChange} placeholder={hint} required {...inputProps} /> :
      <div className="input-wrap"><input id={id} name={name} type="number" value={values[name]} onChange={onChange} required {...inputProps} /><span>{hint}</span></div>}
  </div>;
}

function FormSection({ title, description, fields, values, onChange }) {
  return <section className="form-section">
    <div className="section-heading"><h2>{title}</h2><p>{description}</p></div>
    <div className="field-grid">{fields.map((field) => <Field key={field} name={field} values={values} onChange={onChange} />)}</div>
  </section>;
}

export default function App() {
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    // Full name stays in the browser. The model's required dataset column is supplied internally.
    const payload = {
      dataset: "Cleveland", age: Number(values.age), sex: values.sex, cp: values.cp,
      trestbps: Number(values.trestbps), chol: Number(values.chol), fbs: values.fbs,
      restecg: values.restecg, thalch: Number(values.thalch), exang: values.exang,
      oldpeak: Number(values.oldpeak), slope: values.slope, ca: Number(values.ca), thal: values.thal,
    };

    try {
      const response = await fetch(`${API_URL}/predict`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(data.detail) ? "Please review the form values and try again." : data.detail;
        throw new Error(detail || "The prediction request could not be completed.");
      }
      setResult(data);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "The backend is unavailable. Start the FastAPI server and try again." : requestError.message);
    } finally { setIsLoading(false); }
  }

  return <div className="app-shell">
    <header className="site-header"><div className="brand-mark" aria-hidden="true">HD</div><div><p className="eyebrow">Machine Learning Practice Project</p><h1>Heart Disease ML Classifier</h1><p className="subtitle">Educational Machine Learning Demonstration</p></div></header>
    <main>
      <div className="intro-row"><div><p className="eyebrow">Prediction form</p><h2>Health information</h2><p>Enter the requested details to generate an educational model result.</p></div><p className="notice">For educational use only. This tool does not provide a medical diagnosis.</p></div>
      <div className="workspace">
        <form className="prediction-form" onSubmit={handleSubmit}>
          <FormSection title="Personal Information" description="Required details." fields={["fullName", "age", "sex"]} values={values} onChange={handleChange} />
          <FormSection title="Health Information" description="All fields are required to generate a result." fields={["trestbps", "chol", "thalch", "oldpeak", "ca", "cp", "fbs", "restecg", "exang", "slope", "thal"]} values={values} onChange={handleChange} />
          <div className="form-actions"><p>All fields are required.</p><button type="submit" disabled={isLoading}>{isLoading ? "Running model..." : "Run prediction"}</button></div>
        </form>
        <aside className="side-panel" aria-live="polite">{error && <div className="message error-message" role="alert"><strong>Unable to run prediction</strong><p>{error}</p></div>}{result ? <ResultCard result={result} /> : <EmptyResult />}</aside>
      </div>
      <section className="about-section"><p className="eyebrow">About this project</p><h2>Educational machine-learning demonstration.</h2><p>This project demonstrates an end-to-end machine-learning workflow using a heart disease dataset. The model was trained using preprocessing, categorical encoding, feature scaling, and Logistic Regression.</p><p className="disclaimer">This application is not clinically validated and is not a medical device.</p></section>
    </main>
  </div>;
}

function EmptyResult() { return <div className="message neutral-message"><p className="eyebrow">Prediction result</p><h2>Awaiting input</h2><p>Complete the form to generate a result.</p></div>; }

function ResultCard({ result }) {
  const isDisease = result.prediction === 1;
  return <div className={`result-card ${isDisease ? "result-positive" : "result-negative"}`}><p className="eyebrow">Prediction result</p><h2>Model classification: {result.prediction_label}</h2>{typeof result.probability === "number" && <p className="probability">Model probability: <strong>{Math.round(result.probability * 100)}%</strong></p>}<p className="result-disclaimer">This result is generated by a machine-learning model for educational purposes only. It is not a medical diagnosis and should not replace advice from a qualified healthcare professional.</p></div>;
}
