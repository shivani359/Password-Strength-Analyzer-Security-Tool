import { randomInt } from "node:crypto";

export type PersonalContext = {
  firstName?: string;
  birthYear?: string;
  organization?: string;
};

export type PasswordPolicy = {
  minimumLength: number;
  rejectCommonPasswords: boolean;
  checkPersonalInfo: boolean;
  allowSpaces: boolean;
};

export type Finding = {
  type: string;
  severity: "positive" | "caution" | "critical";
  title: string;
  detail: string;
};

export type Suggestion = {
  title: string;
  detail: string;
};

export type AnalysisResult = {
  score: number;
  classification: "VERY WEAK" | "WEAK" | "MODERATE" | "STRONG" | "VERY STRONG";
  findings: Finding[];
  suggestions: Suggestion[];
  metrics: {
    length: number;
    lengthBand: string;
    uniqueCharacterCount: number;
    uniqueCharacterRatio: number;
    characterPool: number;
    characterTypes: number;
    estimatedEntropy: number;
    patternCount: number;
    policyPass: boolean;
    policyChecks: { label: string; passed: boolean }[];
  };
};

const commonPasswords = new Set([
  "123456",
  "12345678",
  "123456789",
  "password",
  "password123",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "monkey",
  "dragon",
]);

const dictionaryWords = new Set([
  "password",
  "welcome",
  "admin",
  "letmein",
  "hello",
  "qwerty",
  "summer",
  "secret",
  "login",
  "football",
  " sunshine ",
]);

const keyboardPatterns = [
  "qwerty",
  "asdf",
  "zxcv",
  "qaz",
  "wsx",
  "edc",
  "1qaz",
  "qwerty123",
];

const defaultPolicy: PasswordPolicy = {
  minimumLength: 12,
  rejectCommonPasswords: true,
  checkPersonalInfo: true,
  allowSpaces: true,
};

const cleanContextValue = (value: string | undefined) =>
  value?.trim().toLocaleLowerCase().replace(/\s+/g, "") ?? "";

const hasRun = (value: string): boolean => {
  for (let index = 0; index <= value.length - 4; index += 1) {
    let ascending = true;
    let descending = true;
    for (let offset = 1; offset < 4; offset += 1) {
      const difference = value.charCodeAt(index + offset) - value.charCodeAt(index + offset - 1);
      ascending = ascending && difference === 1;
      descending = descending && difference === -1;
    }
    if (ascending || descending) return true;
  }
  return false;
};

const hasRepeatedSubstring = (value: string): boolean => {
  for (let size = 2; size <= Math.floor(value.length / 2); size += 1) {
    for (let index = 0; index <= value.length - size * 2; index += 1) {
      const fragment = value.slice(index, index + size);
      if (fragment === value.slice(index + size, index + size * 2)) return true;
    }
  }
  return false;
};

const getLengthBand = (length: number) => {
  if (length === 0) return "No password";
  if (length < 8) return "Very short";
  if (length < 12) return "Short";
  if (length < 16) return "Better length";
  return "Strong length contribution";
};

const getClassification = (score: number): AnalysisResult["classification"] => {
  if (score <= 20) return "VERY WEAK";
  if (score <= 40) return "WEAK";
  if (score <= 60) return "MODERATE";
  if (score <= 80) return "STRONG";
  return "VERY STRONG";
};

const characterPoolSize = (password: string) => {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z\d\s]/.test(password)) pool += 33;
  if (/\s/.test(password)) pool += 1;
  return pool;
};

const pushSuggestion = (suggestions: Suggestion[], title: string, detail: string) => {
  if (!suggestions.some((suggestion) => suggestion.title === title)) {
    suggestions.push({ title, detail });
  }
};

export function analyzePassword(
  password: string,
  personalContext: PersonalContext = {},
  suppliedPolicy?: PasswordPolicy,
): AnalysisResult {
  const policy = { ...defaultPolicy, ...suppliedPolicy };
  const findings: Finding[] = [];
  const suggestions: Suggestion[] = [];
  const normalized = password.toLocaleLowerCase();
  const length = password.length;
  const uniqueCharacterCount = new Set(password).size;
  const uniqueCharacterRatio = length === 0 ? 0 : Number((uniqueCharacterCount / length).toFixed(2));
  const characterTypes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z\d\s]/.test(password),
    /\s/.test(password),
  ].filter(Boolean).length;
  const pool = characterPoolSize(password);
  const estimatedEntropy = length === 0 || pool === 0 ? 0 : Number((length * Math.log2(pool)).toFixed(1));
  const patternTypes: string[] = [];

  if (length === 0) {
    findings.push({
      type: "empty",
      severity: "critical",
      title: "Enter a password to begin",
      detail: "The analyzer works locally and will not retain what you type.",
    });
    pushSuggestion(suggestions, "Start with length", "Use a unique password or passphrase of at least 12 characters.");
  } else {
    const common = commonPasswords.has(normalized);
    const dictionary = [...dictionaryWords].some((word) => normalized.includes(word.trim()));
    const repeatedCharacters = /(.)\1{2,}/u.test(password);
    const repeatedSubstring = hasRepeatedSubstring(normalized);
    const sequence = hasRun(normalized);
    const keyboard = keyboardPatterns.some((pattern) => normalized.includes(pattern));
    const predictableYear = /(19|20)\d{2}/.test(password);
    const predictableWordNumber = /^[a-z]+[!@#$%^&*]?\d{1,4}[!@#$%^&*]?$/i.test(password);
    const contextValues = Object.values(personalContext)
      .map(cleanContextValue)
      .filter((value) => value.length >= 3);
    const personalOverlap = policy.checkPersonalInfo && contextValues.some((value) => cleanContextValue(password).includes(value));

    if (length >= 12) {
      findings.push({
        type: "length",
        severity: "positive",
        title: "Good length",
        detail: "Longer passwords generally increase resistance to guessing.",
      });
    } else {
      findings.push({
        type: "length",
        severity: length < 8 ? "critical" : "caution",
        title: length < 8 ? "Very short" : "Length could be improved",
        detail: `This password is ${length} characters long. Aim for at least ${policy.minimumLength}.`,
      });
      patternTypes.push("short");
      pushSuggestion(suggestions, "Use more length", `Aim for ${policy.minimumLength}+ characters or a random passphrase.`);
    }

    if (characterTypes >= 3) {
      findings.push({
        type: "diversity",
        severity: "positive",
        title: "Character variety",
        detail: "Multiple character types help when they are combined with unpredictability.",
      });
    } else {
      findings.push({
        type: "diversity",
        severity: "caution",
        title: "Limited character variety",
        detail: "This password uses fewer character types than a more resilient alternative.",
      });
      pushSuggestion(suggestions, "Add variety carefully", "Mix character types without replacing length or relying on predictable substitutions.");
    }

    if (common) {
      patternTypes.push("common");
      findings.push({
        type: "common-password",
        severity: "critical",
        title: "Common password detected",
        detail: "This matches a small educational list of frequently used passwords.",
      });
      pushSuggestion(suggestions, "Avoid common passwords", "Choose a password that does not appear in common-password lists.");
    }

    if (dictionary) {
      patternTypes.push("dictionary");
      findings.push({
        type: "dictionary",
        severity: "caution",
        title: "Common word detected",
        detail: "A familiar word can make a password easier to guess, especially with a suffix.",
      });
      pushSuggestion(suggestions, "Reduce word predictability", "Use randomly selected words or a password-manager-generated value.");
    }

    if (repeatedCharacters || repeatedSubstring) {
      patternTypes.push("repetition");
      findings.push({
        type: "repetition",
        severity: "caution",
        title: "Repeated pattern detected",
        detail: "Repeated characters or chunks reduce effective unpredictability.",
      });
      pushSuggestion(suggestions, "Remove repeated patterns", "Avoid repeating the same character or substring to add length.");
    }

    if (sequence) {
      patternTypes.push("sequence");
      findings.push({
        type: "sequence",
        severity: "caution",
        title: "Sequential pattern detected",
        detail: "Ascending or descending runs such as numbers or letters are predictable.",
      });
      pushSuggestion(suggestions, "Remove predictable sequences", "Avoid consecutive number or letter runs, including reversed runs.");
    }

    if (keyboard) {
      patternTypes.push("keyboard");
      findings.push({
        type: "keyboard",
        severity: "caution",
        title: "Keyboard pattern detected",
        detail: "Keyboard walks are common guesses even when they contain several characters.",
      });
      pushSuggestion(suggestions, "Avoid keyboard walks", "Do not rely on patterns such as qwerty, asdf, or adjacent-key paths.");
    }

    if (predictableWordNumber || predictableYear) {
      patternTypes.push("predictable-structure");
      findings.push({
        type: "predictable-structure",
        severity: "caution",
        title: "Predictable word-and-number structure",
        detail: "Adding a short number or year to a familiar word does not make it random.",
      });
      pushSuggestion(suggestions, "Avoid predictable suffixes", "Do not append a birth year, current year, or short number to a common word.");
    }

    if (personalOverlap) {
      patternTypes.push("personal-information");
      findings.push({
        type: "personal-information",
        severity: "critical",
        title: "Personal information overlap",
        detail: "The password appears to contain information you supplied for this local check.",
      });
      pushSuggestion(suggestions, "Remove personal information", "Avoid names, organization names, and birth years that others could know.");
    }

    if (patternTypes.length === 0) {
      findings.push({
        type: "pattern-resistance",
        severity: "positive",
        title: "No obvious patterns found",
        detail: "This check did not find common sequences, keyboard walks, or repetition.",
      });
    }

    if (!policy.allowSpaces && /\s/.test(password)) {
      patternTypes.push("spaces");
      findings.push({
        type: "policy-spaces",
        severity: "caution",
        title: "Spaces are disabled by policy",
        detail: "This password includes a space while the selected policy does not allow spaces.",
      });
    }

    if (suggestions.length === 0) {
      pushSuggestion(suggestions, "Protect the account", "Use a unique password, store it in a password manager, and enable MFA where available.");
    } else {
      pushSuggestion(suggestions, "Protect the account", "Avoid reusing this password across accounts and enable MFA where available.");
    }

    const baseLength = Math.min(35, Math.round((length / 20) * 35));
    const diversityScore = Math.min(15, characterTypes * 3);
    const ratioScore = Math.min(10, Math.round(uniqueCharacterRatio * 10));
    const resistanceScore = Math.max(0, 20 - patternTypes.length * 4);
    const commonScore = common ? 0 : 10;
    const unpredictabilityScore = Math.min(10, Math.max(0, Math.round(estimatedEntropy / 10)));
    const penalty =
      (common ? 35 : 0) +
      (dictionary ? 12 : 0) +
      (keyboard ? 10 : 0) +
      (sequence ? 8 : 0) +
      (repeatedCharacters || repeatedSubstring ? 10 : 0) +
      (personalOverlap ? 12 : 0) +
      (predictableWordNumber || predictableYear ? 8 : 0) +
      (length < 8 ? 15 : 0);
    const score = Math.max(
      0,
      Math.min(100, baseLength + diversityScore + ratioScore + resistanceScore + commonScore + unpredictabilityScore - penalty),
    );

    const policyChecks = [
      { label: `At least ${policy.minimumLength} characters`, passed: length >= policy.minimumLength },
      { label: "Not a common password", passed: !policy.rejectCommonPasswords || !common },
      { label: "No personal information overlap", passed: !policy.checkPersonalInfo || !personalOverlap },
      { label: "Spaces follow policy", passed: policy.allowSpaces || !/\s/.test(password) },
    ];

    return {
      score,
      classification: getClassification(score),
      findings,
      suggestions,
      metrics: {
        length,
        lengthBand: getLengthBand(length),
        uniqueCharacterCount,
        uniqueCharacterRatio,
        characterPool: pool,
        characterTypes,
        estimatedEntropy,
        patternCount: patternTypes.length,
        policyPass: policyChecks.every((check) => check.passed),
        policyChecks,
      },
    };
  }

  const policyChecks = [
    { label: `At least ${policy.minimumLength} characters`, passed: false },
    { label: "Not a common password", passed: true },
    { label: "No personal information overlap", passed: true },
    { label: "Spaces follow policy", passed: true },
  ];

  return {
    score: 0,
    classification: "VERY WEAK",
    findings,
    suggestions,
    metrics: {
      length,
      lengthBand: getLengthBand(length),
      uniqueCharacterCount,
      uniqueCharacterRatio,
      characterPool: pool,
      characterTypes,
      estimatedEntropy,
      patternCount: 1,
      policyPass: false,
      policyChecks,
    },
  };
}

const generationSets = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%^&*_-+=",
} as const;

export function generateSecurePassword(options: {
  length: 16 | 20 | 24;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}) {
  const selected = Object.entries(generationSets)
    .filter(([key]) => options[key as keyof typeof options])
    .map(([, characters]) => characters);
  if (selected.length === 0) throw new Error("Select at least one character set");
  const passwordCharacters = selected.map((characters) => characters[randomInt(characters.length)]);
  const allCharacters = selected.join("");
  while (passwordCharacters.length < options.length) {
    passwordCharacters.push(allCharacters[randomInt(allCharacters.length)]);
  }
  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }
  return {
    password: passwordCharacters.join(""),
    length: passwordCharacters.length,
    composition: selected.map((characters) => {
      if (characters === generationSets.uppercase) return "Uppercase";
      if (characters === generationSets.lowercase) return "Lowercase";
      if (characters === generationSets.numbers) return "Numbers";
      return "Symbols";
    }),
  };
}
