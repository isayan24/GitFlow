// Mapping days for punch card
export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Mappings for language colors
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Java: "#b07219",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Objective_C: "#438eff",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  SCSS: "#c6538c",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
};

export const getLanguageColor = (lang: string): string => {
  return LANGUAGE_COLORS[lang] || "#8b949e";
};

export interface RadarProfile {
  feature: number;
  fix: number;
  refactor: number;
  test: number;
  docs: number;
  chore: number;
}

export const generateAiTip = (profile?: RadarProfile): string | null => {
  if (!profile) return null;
  
  const maxFocus = Object.entries(profile).sort((a, b) => b[1] - a[1])[0];

  if (!maxFocus || maxFocus[1] === 0) {
    return "Import more repositories and push commits to build your productivity radar!";
  }

  switch (maxFocus[0]) {
    case "feature":
      return "You're heavily focused on delivering features this week. Try scheduling tests or refactoring tasks to ensure code quality is maintained.";
    case "fix":
      return "You spent significant time debugging. Consider writing additional unit tests to catch regression issues early.";
    case "refactor":
      return "Excellent cleanup effort! After refactoring, confirm your tests still cover the critical paths and update any stale docs.";
    case "test":
      return "Outstanding testing coverage! Lock in this progress and shift focus back to shipping the next feature set.";
    case "docs":
      return "Great documentation focus. Good readmes make onboarding a breeze; next up, sink your teeth into refactoring.";
    default:
      return "Chore focus is high. Keeping dependencies updated is crucial, but remember to balance maintenance with active code delivery.";
  }
};
