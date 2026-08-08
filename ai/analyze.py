def analyze(v):
    def bp(x):
        s, d = map(int, x.split('/'))
        return 'high' if s >= 140 or d >= 90 else 'low' if s < 90 or d < 60 else 'normal'

    def sugar(x):
        return 'high' if x >= 126 else 'low' if x < 70 else 'normal'

    def hba1c(x):
        return 'diabetes_range' if x >= 6.5 else 'prediabetes_range' if x >= 5.7 else 'normal'

    def hgb(x):
        return 'low' if x < 12.0 else 'high' if x > 17.5 else 'normal'

    def chol(x):
        return 'high' if x >= 240 else 'borderline' if 200 <= x <= 239 else 'normal'

    return {
        'blood_pressure': bp(v['blood_pressure']),
        'fasting_sugar': sugar(v['fasting_sugar']),
        'hba1c': hba1c(v['hba1c']),
        'hemoglobin': hgb(v['hemoglobin']),
        'cholesterol': chol(v['cholesterol']),
    }

if __name__ == "__main__":
    extracted = {
        'blood_pressure': '152/96',
        'fasting_sugar': 168,
        'hba1c': 7.2,
        'hemoglobin': 11.2,
        'cholesterol': 245,
    }
    print(analyze(extracted))
