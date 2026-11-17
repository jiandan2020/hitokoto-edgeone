import { ref, watch } from "vue";

const THEME_KEY = "hitokoto-theme";

function getInitialTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") {
            return saved;
        }
    } catch {
        // localStorage 不可用时走系统偏好。
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

export function useTheme() {
    const theme = ref(getInitialTheme());

    function applyTheme(value) {
        document.documentElement.setAttribute("data-theme", value);
    }

    function toggleTheme() {
        theme.value = theme.value === "dark" ? "light" : "dark";
    }

    function setTheme(value) {
        theme.value = value;
    }

    watch(theme, (value) => {
        applyTheme(value);
        try {
            localStorage.setItem(THEME_KEY, value);
        } catch {
            // 忽略写入失败。
        }
    }, { immediate: true });

    return { theme, toggleTheme, setTheme };
}
