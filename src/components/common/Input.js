// Common Input component
export function createInput({
    type = 'text',
    label,
    placeholder,
    value = '',
    onChange,
    className = '',
    id,
    name,
    required = false,
    readonly = false,
    rows = 3, // For textarea
}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';

    if (label) {
        const labelEl = document.createElement('label');
        labelEl.className = 'block text-sm font-medium text-gray-700';
        labelEl.textContent = label;
        if (id) labelEl.htmlFor = id;
        wrapper.appendChild(labelEl);
    }

    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    const baseClasses = 'w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow';

    input.className = `${baseClasses} ${className}`;
    if (type !== 'textarea') input.type = type;
    if (id) input.id = id;
    if (name) input.name = name;
    if (placeholder) input.placeholder = placeholder;
    if (value) input.value = value;
    if (required) input.required = true;
    if (readonly) input.readOnly = true;
    if (type === 'textarea') input.rows = rows;

    if (onChange) {
        input.addEventListener('input', (e) => onChange(e.target.value, e));
    }

    wrapper.appendChild(input);
    return wrapper;
}
