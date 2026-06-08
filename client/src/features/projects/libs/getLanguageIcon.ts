export const getLanguageIcon = (language: string | null, name: string) => {
  const repoName = name.toLowerCase();

  if (language) {
    const lang = language.toLowerCase();

    if (lang === "typescript" || lang === "javascript") {
      if (repoName.includes("next") || repoName.includes("nextjs")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg";
      }
      if (
        repoName.includes("react") ||
        repoName.includes("reactjs") ||
        repoName.includes("client") ||
        repoName.includes("frontend") ||
        repoName.includes("landing") ||
        repoName.includes("dashboard")
      ) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg";
      }
      if (
        repoName.includes("node") ||
        repoName.includes("backend") ||
        repoName.includes("server") ||
        repoName.includes("api")
      ) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg";
      }
      return lang === "typescript"
        ? "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg"
        : "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg";
    }

    if (lang === "python") {
      if (repoName.includes("fastapi")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg";
      }
      if (repoName.includes("django")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg";
      }
      if (repoName.includes("flask")) {
        return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg";
      }
      return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg";
    }

    if (lang === "go") {
      return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg";
    }
    if (lang === "rust") {
      return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg";
    }
    if (lang === "html") {
      return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg";
    }
    if (lang === "css") {
      return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg";
    }
  }

  // Pure name-based fallback if language metadata is missing
  if (repoName.includes("next") || repoName.includes("nextjs")) {
    return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg";
  }
  if (repoName.includes("react") || repoName.includes("reactjs")) {
    return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg";
  }
  if (repoName.includes("fastapi")) {
    return "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg";
  }

  return null;
};
