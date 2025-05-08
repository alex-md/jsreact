// jsxRuntime.js
// Provides a simplified React implementation for the playground

export const getJsxRuntimeCode = () => `
// Enhanced support for JSX-like syntax in the playground
const React = {
    createElement: function(type, props = {}, ...children) {
        try {
            // Handle function components
            if (typeof type === 'function') {
                try {
                    const result = type({ ...props, children: children.length === 1 ? children[0] : children });
                    
                    // If the result is a DOM element, return it
                    if (result && result.nodeType) {
                        return result;
                    }
                    
                    // Create a container for component output
                    const container = document.createElement('div');
                    container.className = 'jsx-component';
                    container.dataset.componentName = type.name || 'AnonymousComponent';
                    
                    if (result !== null && result !== undefined) {
                        const content = document.createElement('pre');
                        content.textContent = JSON.stringify(result, null, 2);
                        container.appendChild(content);
                    }
                    
                    return container;
                } catch (err) {
                    const errorEl = document.createElement('div');
                    errorEl.className = 'jsx-error';
                    errorEl.textContent = \`Error in component \${type.name || 'Component'}: \${err.message}\`;
                    return errorEl;
                }
            }
            
            // Regular DOM elements
            const element = document.createElement(type);
            
            // Apply props to the element
            if (props) {
                Object.keys(props).forEach(key => {
                    try {
                        if (key === 'className') {
                            element.className = props[key];
                        } else if (key === 'style' && typeof props[key] === 'object') {
                            Object.assign(element.style, props[key]);
                        } else if (key.startsWith('on') && typeof props[key] === 'function') {
                            const eventName = key.slice(2).toLowerCase();
                            const handler = (event) => {
                                try {
                                    props[key](event);
                                } catch (err) {
                                    console.error(\`Error in event handler: \${err.message}\`);
                                }
                            };
                            element.addEventListener(eventName, handler);
                        } else if (key !== 'children' && typeof props[key] !== 'function') {
                            if (typeof props[key] === 'boolean') {
                                if (props[key]) {
                                    element.setAttribute(key, '');
                                }
                            } else {
                                element.setAttribute(key, props[key]);
                            }
                        }
                    } catch (err) {
                        console.error(\`Error setting prop \${key}: \${err.message}\`);
                    }
                });
            }
            
            // Handle children
            children.flat().forEach(child => {
                try {
                    if (child === null || child === undefined) {
                        // Skip null or undefined children
                        return;
                    } else if (typeof child === 'object' && child.nodeType) {
                        element.appendChild(child);
                    } else {
                        element.appendChild(document.createTextNode(String(child)));
                    }
                } catch (err) {
                    console.error(\`Error handling child: \${err.message}\`);
                }
            });
            
            return element;
        } catch (error) {
            console.error('Error in React.createElement:', error);
            const errorEl = document.createElement('div');
            errorEl.className = 'jsx-error';
            errorEl.textContent = \`JSX Error: \${error.message}\`;
            return errorEl;
        }
    },
    
    // Basic hooks implementation
    useState: function(initialValue) {
        const value = typeof initialValue === 'function' ? initialValue() : initialValue;
        const setState = function(newValue) {
            console.log('State update called (preview only)');
            // This is a simplified version that doesn't trigger re-renders
            return typeof newValue === 'function' ? newValue(value) : newValue;
        };
        return [value, setState];
    },
    
    useEffect: function(effect, deps) {
        try {
            const cleanup = effect();
            if (typeof cleanup === 'function') {
                window.addEventListener('unload', cleanup);
            }
        } catch (err) {
            console.error('Error in useEffect:', err);
        }
    },
    
    // Provide minimal versions of other React features
    Fragment: 'div',
    createContext: function() {
        return {
            Provider: function() { return document.createElement('div'); },
            Consumer: function() { return document.createElement('div'); }
        };
    },
    
    // Add memo and other commonly used React features
    memo: function(component) { return component; },
    forwardRef: function(component) { return component; },
    
    // Error boundary support
    Component: class {
        constructor() {
            this.state = {};
        }
        setState() {}
        forceUpdate() {}
    }
};
`;
