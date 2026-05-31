/**
 * Rendu Markdown léger pour les réponses de l'assistant (listes, gras, emails…).
 */

function parseInline(text) {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|`([^`]+)`|__(.+?)__|\*([^*]+?)\*)/g;
    let last = 0;
    let match = re.exec(text);
    while (match) {
        if (match.index > last) {
            parts.push({ type: 'text', value: text.slice(last, match.index) });
        }
        if (match[2]) parts.push({ type: 'bold', value: match[2] });
        else if (match[3]) parts.push({ type: 'code', value: match[3] });
        else if (match[4]) parts.push({ type: 'bold', value: match[4] });
        else if (match[5]) parts.push({ type: 'italic', value: match[5] });
        last = match.index + match[0].length;
        match = re.exec(text);
    }
    if (last < text.length) {
        parts.push({ type: 'text', value: text.slice(last) });
    }
    return parts;
}

function InlineContent({ text, inverted }) {
    const parts = parseInline(text);
    return (
        <>
            {parts.map((part, i) => {
                if (part.type === 'bold') {
                    return (
                        <strong key={i} className="font-semibold">
                            {part.value}
                        </strong>
                    );
                }
                if (part.type === 'italic') {
                    return <em key={i}>{part.value}</em>;
                }
                if (part.type === 'code') {
                    return (
                        <code
                            key={i}
                            className={`px-1.5 py-0.5 rounded text-[0.85em] font-mono ${
                                inverted ? 'bg-white/15 text-white' : 'bg-[#C1E8FF]/60 text-[#052659]'
                            }`}
                        >
                            {part.value}
                        </code>
                    );
                }
                return <span key={i}>{part.value}</span>;
            })}
        </>
    );
}

function isEmailBlockStart(line) {
    const t = line.trim().toLowerCase();
    return t.startsWith('objet :') || t.startsWith('objet:') || t.startsWith('subject:');
}

function blockifyMarkdown(raw) {
    const lines = raw.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let list = null;
    let emailLines = null;

    const flushList = () => {
        if (list) {
            blocks.push(list);
            list = null;
        }
    };

    const flushEmail = () => {
        if (emailLines && emailLines.length) {
            blocks.push({ type: 'email', lines: emailLines });
            emailLines = null;
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();

        if (isEmailBlockStart(trimmed)) {
            flushList();
            emailLines = [line];
            continue;
        }

        if (emailLines !== null) {
            if (
                trimmed === '' &&
                emailLines.length > 2 &&
                !emailLines[emailLines.length - 1].trim().startsWith('Cordialement')
            ) {
                flushEmail();
                continue;
            }
            emailLines.push(line);
            if (/^cordialement,?$/i.test(trimmed) || /^bien cordialement,?$/i.test(trimmed)) {
                const nextIdx = lines.indexOf(line) + 1;
                const nextLine = lines[nextIdx]?.trim() ?? '';
                if (nextLine && nextLine.length < 80 && !nextLine.match(/^\d+\./)) {
                    emailLines.push(lines[nextIdx]);
                }
                flushEmail();
            }
            continue;
        }

        const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (olMatch) {
            flushEmail();
            if (!list || list.type !== 'ol') {
                flushList();
                list = { type: 'ol', items: [] };
            }
            list.items.push(olMatch[2]);
            continue;
        }

        const ulMatch = trimmed.match(/^[-*•]\s+(.+)/);
        if (ulMatch) {
            flushEmail();
            if (!list || list.type !== 'ul') {
                flushList();
                list = { type: 'ul', items: [] };
            }
            list.items.push(ulMatch[1]);
            continue;
        }

        flushList();
        flushEmail();

        if (!trimmed) {
            blocks.push({ type: 'space' });
            continue;
        }

        const h3 = trimmed.match(/^###\s+(.+)/);
        if (h3) {
            blocks.push({ type: 'h3', text: h3[1] });
            continue;
        }
        const h2 = trimmed.match(/^##\s+(.+)/);
        if (h2) {
            blocks.push({ type: 'h2', text: h2[1] });
            continue;
        }

        blocks.push({ type: 'p', text: line.trimEnd() });
    }

    flushList();
    flushEmail();
    return blocks;
}

export default function AssistantMessageContent({ content, inverted = false }) {
    const blocks = blockifyMarkdown(content);

    const textClass = inverted ? 'text-white' : 'text-[#052659]';
    const mutedClass = inverted ? 'text-white/80' : 'text-slate-600';

    return (
        <div className={`assistant-md text-sm leading-relaxed ${textClass} space-y-2`}>
            {blocks.map((block, i) => {
                if (block.type === 'space') {
                    return <div key={i} className="h-1" />;
                }
                if (block.type === 'h2') {
                    return (
                        <h3 key={i} className={`text-base font-bold mt-2 ${textClass}`}>
                            <InlineContent text={block.text} inverted={inverted} />
                        </h3>
                    );
                }
                if (block.type === 'h3') {
                    return (
                        <h4 key={i} className={`text-sm font-bold mt-1.5 ${textClass}`}>
                            <InlineContent text={block.text} inverted={inverted} />
                        </h4>
                    );
                }
                if (block.type === 'ol') {
                    return (
                        <ol
                            key={i}
                            className={`list-decimal list-outside ml-4 space-y-2 my-1 ${mutedClass}`}
                        >
                            {block.items.map((item, j) => (
                                <li key={j} className="pl-1">
                                    <InlineContent text={item} inverted={inverted} />
                                </li>
                            ))}
                        </ol>
                    );
                }
                if (block.type === 'ul') {
                    return (
                        <ul
                            key={i}
                            className={`list-disc list-outside ml-4 space-y-1.5 my-1 ${mutedClass}`}
                        >
                            {block.items.map((item, j) => (
                                <li key={j} className="pl-0.5">
                                    <InlineContent text={item} inverted={inverted} />
                                </li>
                            ))}
                        </ul>
                    );
                }
                if (block.type === 'email') {
                    return (
                        <div
                            key={i}
                            className={`my-2 rounded-xl border px-3 py-2.5 text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                                inverted
                                    ? 'bg-white/10 border-white/20 text-white/95'
                                    : 'bg-[#f4f8fc] border-[#C1E8FF] text-[#052659]'
                            }`}
                        >
                            {block.lines.map((ln, j) => (
                                <span key={j}>
                                    {j > 0 && '\n'}
                                    <InlineContent text={ln} inverted={inverted} />
                                </span>
                            ))}
                        </div>
                    );
                }
                return (
                    <p key={i} className={mutedClass}>
                        <InlineContent text={block.text} inverted={inverted} />
                    </p>
                );
            })}
        </div>
    );
}
