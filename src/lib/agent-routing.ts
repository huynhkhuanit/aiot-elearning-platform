const ANSWER_ONLY_RE =
    /v[ií] d[uụ]|example|gi[aả]i th[ií]ch|explain|l[aà] g[iì]|what is|t[oó]m t[aắ]t|summary|h[uư][oớ]ng d[aẫ]n|how to/i;

const DIRECT_EDIT_RE =
    /s[uử]a|ch[iỉ]nh|thay [dđ][oổ]i|[dđ][oổ]i|th[eê]m|x[oó]a|xo[aá]|c[aậ]p nh[aậ]t|update|edit|modify|fix|apply|[aá]p d[uụ]ng/i;

const CREATION_RE =
    /t[aạ]o|create|build|generate|implement|thi[eế]t k[eế]/i;

export function shouldUseAgentTools(message: string): boolean {
    const normalized = message.trim();
    if (!normalized) return false;

    if (DIRECT_EDIT_RE.test(normalized)) return true;

    if (ANSWER_ONLY_RE.test(normalized)) return false;

    return CREATION_RE.test(normalized);
}
