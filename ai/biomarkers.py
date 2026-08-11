"""
Biomarker configuration for clinical report parsing.

This module defines a dictionary-driven biomarker registry that supports
reports from multiple labs (Thyrocare, Apollo Diagnostics, Vijaya Diagnostics,
Aarthi Scans, Dr Lal PathLabs, SRL Diagnostics, and generic pathology labs).

Each biomarker has:
  - key: unique identifier used in the extracted values dict
  - name: human-readable display name
  - patterns: list of regex name aliases (most specific first for matching)
  - unit: expected unit of measurement (for display)
  - normal_range: (min, max) tuple for analysis thresholds
  - is_bp: special blood-pressure handling (systolic/diastolic)
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class BiomarkerConfig:
    key: str
    name: str
    patterns: list[str]
    unit: str | None = None
    normal_range: tuple[float, float] | None = None
    is_bp: bool = False
    bp_systolic_range: tuple[float, float] | None = None
    bp_diastolic_range: tuple[float, float] | None = None


# Each biomarker: key, name, list of regex patterns (most specific first),
# expected unit, (min, max) normal range.
BIOMARKERS: list[BiomarkerConfig] = [
    # --- Lipid Profile ---
    BiomarkerConfig(
        key="cholesterol",
        name="Total Cholesterol",
        patterns=[
            r"total\s*cholesterol",
            r"serum\s*cholesterol",
            r"cholesterol\s*\(total\)",
            r"cholestrol",
            r"cholesterol",
            r"\bchol\b",
        ],
        unit="mg/dL",
        normal_range=(0, 200),
    ),
    BiomarkerConfig(
        key="hdl",
        name="HDL Cholesterol",
        patterns=[
            r"hdl\s*cholesterol\s*direct",
            r"cholesterol\s*-\s*hdl",
            r"hdl\s*cholesterol",
            r"hdl\s*chol",
            r"\bhdl\b",
        ],
        unit="mg/dL",
        normal_range=(40, 100),
    ),
    BiomarkerConfig(
        key="ldl",
        name="LDL Cholesterol",
        patterns=[
            r"ldl\s*cholesterol\s*direct",
            r"cholesterol\s*-\s*ldl",
            r"ldl\s*cholesterol",
            r"ldl\s*chol",
            r"\bldl\b",
        ],
        unit="mg/dL",
        normal_range=(0, 100),
    ),
    BiomarkerConfig(
        key="triglycerides",
        name="Triglycerides",
        patterns=[
            r"triglyceride\s*level",
            r"triglycerides?",
            r"\btg\b",
            r"trigs?",
        ],
        unit="mg/dL",
        normal_range=(0, 150),
    ),
    # --- Glucose / Diabetes ---
    BiomarkerConfig(
        key="fasting_sugar",
        name="Fasting Blood Sugar",
        patterns=[
            r"fasting\s*blood\s*sugar",
            r"fasting\s*plasma\s*glucose",
            r"glucose\s*\(fasting\)",
            r"glucose\s*\(fast\)",
            r"fasting\s*glucose",
            r"\bfbs\b",
        ],
        unit="mg/dL",
        normal_range=(70, 99),
    ),
    BiomarkerConfig(
        key="glucose_ppbs",
        name="PPBS",
        patterns=[
            r"\bppbs\b",
            r"post\s*prandial\s*blood\s*sugar",
            r"post\s*prandial\s*glucose",
            r"post\s*lunch\s*glucose",
            r"2h\s*pp\s*glucose",
        ],
        unit="mg/dL",
        normal_range=(0, 140),
    ),
    BiomarkerConfig(
        key="hba1c",
        name="HbA1c",
        patterns=[
            r"hba1c\s*\(ngsp\)",
            r"hba1c\s*\(glycated\s*hb\)",
            r"hba1c\s*\(ngsp\s*pmp\)",
            r"glycated\s*hemoglobin",
            r"glycated\s*hb",
            r"\bhba1c\b",
        ],
        unit="%",
        normal_range=(0, 5.6),
    ),
    # --- CBC ---
    BiomarkerConfig(
        key="hemoglobin",
        name="Hemoglobin",
        patterns=[
            r"hemoglobin\s*\(hgb\)",
            r"hemoglobin\s*\(hb\)",
            r"hb\s*\(hemoglobin\)",
            r"haemoglobin\s*\(hb\)",
            r"haemoglobin",
            r"hemoglobin\s*-?\s*hb",
            r"hemoglobin",
            r"\bh\s*b\s*g/dl\b",
            r"\bh\s*b\b",
        ],
        unit="g/dL",
        normal_range=(12.0, 17.5),
    ),
    BiomarkerConfig(
        key="wbc",
        name="WBC / White Blood Cells",
        patterns=[
            r"wbc\s*/\s*white\s*blood\s*cells?",
            r"white\s*blood\s*cell\s*count",
            r"wbc\s*count",
            r"white\s*blood\s*cells?\s*\(out\)",
            r"leukocyte\s*count",
            r"\bwbc\b",
            r"\bwhite\s*count\b",
        ],
        unit="10^3/uL",
        normal_range=(4.0, 11.0),
    ),
    BiomarkerConfig(
        key="platelets",
        name="Platelets",
        patterns=[
            r"platelet\s*count",
            r"platelet\s*-\s*count",
            r"platelets?",
        ],
        unit="10^3/uL",
        normal_range=(150, 450),
    ),
    BiomarkerConfig(
        key="rdw",
        name="RDW (Red Cell Distribution Width)",
        patterns=[
            r"rdw\s*cv",
            r"rdw\s*sd",
            r"\brdw\b",
            r"red\s*cell\s*distribution",
        ],
        unit="%",
        normal_range=(11.5, 14.5),
    ),
    BiomarkerConfig(
        key="mcv",
        name="MCV (Mean Corpuscular Volume)",
        patterns=[
            r"\bmcvc",
            r"\bmcv\b",
            r"mean\s*corpuscular\s*volume",
        ],
        unit="fL",
        normal_range=(80, 100),
    ),
    BiomarkerConfig(
        key="hct",
        name="Hematocrit",
        patterns=[
            r"hematocrit\s*\(hct\)",
            r"hematocrit",
            r"haematocrit",
            r"\bhct\b",
            r"packed\s*cell\s*volume",
        ],
        unit="%",
        normal_range=(36, 50),
    ),
    # --- Renal Function ---
    BiomarkerConfig(
        key="creatinine",
        name="Creatinine",
        patterns=[
            r"serum\s*creatinine",
            r"creatinine\s*serum",
            r"creatinine",
            r"\bcr\b",
        ],
        unit="mg/dL",
        normal_range=(0.6, 1.2),
    ),
    BiomarkerConfig(
        key="urea",
        name="Blood Urea",
        patterns=[
            r"blood\s*urea",
            r"serum\s*urea",
            r"urea\s*\(blood\)",
            r"\bbun\b",
            r"\bbu\b",
            r"\burea\b",
        ],
        unit="mg/dL",
        normal_range=(7, 20),
    ),
    BiomarkerConfig(
        key="egfr",
        name="eGFR",
        patterns=[
            r"egfr\s*\(ckd-epi\)",
            r"egfr\s*\(wright\)",
            r"egfr\s*\(mdrd\)",
            r"egfr",
            r"estimated\s*glom\s*filter",
            r"\bgfr\b",
        ],
        unit="mL/min/1.73m2",
        normal_range=(60, 90),
    ),
    # --- Liver Function ---
    BiomarkerConfig(
        key="sgot",
        name="SGOT (AST)",
        patterns=[
            r"sgot\s*\(ast\)",
            r"ast\s*\(sgot\)",
            r"sgot",
            r"\bast\b",
            r"ast\s*gpt",
        ],
        unit="U/L",
        normal_range=(0, 40),
    ),
    BiomarkerConfig(
        key="sgpt",
        name="SGPT (ALT)",
        patterns=[
            r"sgpt\s*\(alt\)",
            r"alt\s*\(sgpt\)",
            r"sgpt",
            r"\balt\b",
            r"alt\s*gpt",
        ],
        unit="U/L",
        normal_range=(0, 45),
    ),
    BiomarkerConfig(
        key="alp",
        name="ALP (Alkaline Phosphatase)",
        patterns=[
            r"alk\s*phos",
            r"alkaline\s*phosphatase",
            r"\balp\b",
        ],
        unit="U/L",
        normal_range=(44, 147),
    ),
    BiomarkerConfig(
        key="bilirubin",
        name="Total Bilirubin",
        patterns=[
            r"total\s*bilirubin",
            r"bilirubin\s*total",
            r"serum\s*bilirubin",
            r"\bbilirubin\b",
            r"\btb\b",
        ],
        unit="mg/dL",
        normal_range=(0.1, 1.2),
    ),
    BiomarkerConfig(
        key="albumin",
        name="Serum Albumin",
        patterns=[
            r"serum\s*albumin",
            r"albumin\s*serum",
            r"\balbumin\b",
        ],
        unit="g/dL",
        normal_range=(3.5, 5.0),
    ),
    BiomarkerConfig(
        key="protein_total",
        name="Total Protein",
        patterns=[
            r"total\s*protein",
            r"protein\s*total",
            r"\bprotein\b",
            r"\btp\b",
        ],
        unit="g/dL",
        normal_range=(6.0, 8.3),
    ),
    # --- Thyroid ---
    BiomarkerConfig(
        key="tsh",
        name="TSH",
        patterns=[
            r"tsh\s*\(thyroid\s*stimulating\s*hormone\)",
            r"thyroid\s*stimulating\s*hormone",
            r"tsh\s*thyroid",
            r"\btsh\b",
        ],
        unit="mIU/L",
        normal_range=(0.4, 4.0),
    ),
    BiomarkerConfig(
        key="ft3",
        name="Free T3",
        patterns=[
            r"free\s*t3\s*\(ft3\)",
            r"ft3\s*\(free\s*t3\)",
            r"free\s*t3",
            r"\bft3\b",
            r"t3\s*free",
        ],
        unit="pg/mL",
        normal_range=(2.3, 4.2),
    ),
    BiomarkerConfig(
        key="ft4",
        name="Free T4",
        patterns=[
            r"free\s*t4\s*\(ft4\)",
            r"ft4\s*\(free\s*t4\)",
            r"free\s*t4",
            r"\bft4\b",
            r"t4\s*free",
        ],
        unit="ng/dL",
        normal_range=(0.8, 1.8),
    ),
    # --- Electrolytes ---
    BiomarkerConfig(
        key="sodium",
        name="Sodium",
        patterns=[
            r"serum\s*sodium\s*\(na\s*\+?\)",
            r"sodium\s*\(na\s*\+?\)",
            r"serum\s*sodium",
            r"sodium\s*serum",
            r"\bsodium\b",
            r"\bna\s*\+\b",
        ],
        unit="mmol/L",
        normal_range=(135, 145),
    ),
    BiomarkerConfig(
        key="potassium",
        name="Potassium",
        patterns=[
            r"serum\s*potassium\s*\(k\s*\+?\)",
            r"potassium\s*\(k\s*\+?\)",
            r"serum\s*potassium",
            r"potassium\s*serum",
            r"\bpotassium\b",
            r"\bk\s*\+\b",
        ],
        unit="mmol/L",
        normal_range=(3.5, 5.1),
    ),
    BiomarkerConfig(
        key="chloride",
        name="Chloride",
        patterns=[
            r"serum\s*chloride\s*\(cl\s*-\s*\)",
            r"chloride\s*\(cl\s*-\s*\)",
            r"serum\s*chloride",
            r"chloride\s*serum",
            r"\bchloride\b",
            r"\bcl\s*-\b",
        ],
        unit="mmol/L",
        normal_range=(96, 106),
    ),
    BiomarkerConfig(
        key="blood_pressure",
        name="Blood Pressure",
        patterns=[
            r"blood\s*pressure\s*(?:s/d|sys/dia)",
            r"blood\s*pressure",
            r"\bbp\s*\(s/d\)",
            r"\bbp\b",
        ],
        unit="mmHg",
        is_bp=True,
        bp_systolic_range=(0, 120),
        bp_diastolic_range=(0, 80),
    ),
    BiomarkerConfig(
        key="pulse",
        name="Pulse",
        patterns=[
            r"pulse\s*rate",
            r"heart\s*rate",
            r"\bpulse\b",
            r"\bpr\b",
        ],
        unit="bpm",
        normal_range=(60, 100),
    ),
    BiomarkerConfig(
        key="spO2",
        name="Oxygen Saturation (SpO2)",
        patterns=[
            r"spo2\s*\(o2\s*sat\)",
            r"\bspo2\b",
            r"oxygen\s*saturation",
            r"sp\s*o2",
            r"o2\s*saturation",
        ],
        unit="%",
        normal_range=(95, 100),
    ),
    BiomarkerConfig(
        key="weight",
        name="Weight",
        patterns=[
            r"\bweight\b",
            r"\bw?t\b",
        ],
        unit="kg",
        normal_range=(40, 120),
    ),
    BiomarkerConfig(
        key="bmi",
        name="BMI",
        patterns=[
            r"\bbmi\s*\(body\s*mass\s*index\)",
            r"body\s*mass\s*index",
            r"\bbmi\b",
        ],
        unit="kg/m2",
        normal_range=(18.5, 24.9),
    ),
]


def get_biomarker_by_key(key: str) -> BiomarkerConfig | None:
    for bm in BIOMARKERS:
        if bm.key == key:
            return bm
    return None


def get_all_biomarker_keys() -> list[str]:
    return [bm.key for bm in BIOMARKERS]


# Sort by pattern specificity (longest pattern first) so that more specific
# biomarkers like "HDL Cholesterol" are matched before generic ones like
# "Cholesterol", preventing overlapping false matches.
BIOMARKERS.sort(key=lambda bm: max(len(p) for p in bm.patterns), reverse=True)
