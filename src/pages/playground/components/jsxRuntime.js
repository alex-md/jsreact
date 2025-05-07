// jsxRuntime.js
// Provides a simplified React implementation for the playground

export const getJsxRuntimeCode = () => `
// Enhanced support for JSX-like syntax in the playground
const React = {
    createElement: function(type, props, ...children) {
        try {
            // Handle function components
            if (typeof type === 'function') {
                try {
                    // Call the component function with props and get the result
                    const result = type({ ...props, children: children.length === 1 ? children[0] : children });
                    
                    // If the result is a DOM element, return it
                    if (result && result.nodeType) {
                        return result;
                    }
                    
                    // Otherwise, create a container div with a special class
                    const container = document.createElement('div');
                    container.className = 'jsx-component';
                    container.dataset.componentName = type.name || 'AnonymousComponent';
                    
                    // Add the string representation of the result
                    const content = document.createElement('pre');
                    content.textContent = JSON.stringify(result, null, 2);
                    container.appendChild(content);
                    
                    return container;
                } catch (err) {
                    // If the component throws an error, create an error element
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
                    if (key === 'className') {
                        element.className = props[key];
                    } else if (key === 'style' && typeof props[key] === 'object') {
                        Object.assign(element.style, props[key]);
                    } else if (key.startsWith('on') && typeof props[key] === 'function') {
                        const eventName = key.slice(2).toLowerCase();
                        element.addEventListener(eventName, props[key]);
                    } else if (key !== 'children' && typeof props[key] !== 'function') {
                        // Handle boolean attributes properly
                        if (typeof props[key] === 'boolean') {
                            if (props[key]) {
                                element.setAttribute(key, '');
                            }
                        } else {
                            element.setAttribute(key, props[key]);
                        }
                    }
                });
            }
            
            // Handle children
            children.flat().forEach(child => {
                if (child === null || child === undefined) {
                    // Skip null or undefined children
                } else if (typeof child === 'object' && child.nodeType) {
                    // If it's a DOM node
                    element.appendChild(child);
                } else {
                    // Text or other content
                    element.appendChild(document.createTextNode(String(child)));
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
    
    // Add basic hooks implementations
    useState: function(initialValue) {
        const value = typeof initialValue === 'function' ? initialValue() : initialValue;
        // Note: This is a very simplified version that won't trigger re-renders
        return [value, function() { console.log('setState called - needs real React for updates'); }];
    },
    
    useEffect: function(callback, deps) {
        // Execute the effect once
        try {
            const cleanup = callback();
            if (typeof cleanup === 'function') {
                // Register cleanup to run on page unload
                window.addEventListener('unload', cleanup);
            }
        } catch (err) {
            console.error('Error in useEffect:', err);
        }
    },
    
    // Support for fragments
    Fragment: 'fragment',
    
    // Add createContext for completeness
    createContext: function() {
        return {
            Provider: function() {},
            Consumer: function() {}
        };
    }
};
`;
