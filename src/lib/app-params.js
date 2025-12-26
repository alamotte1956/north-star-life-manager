const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;
const isTopLevelWindow = !isNode && window.self === window.top;
const isSecureEnvironment = !isNode && (window.isSecureContext || window.location.hostname === 'localhost');

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false, allowUrl = true, allowStored = true, validate } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = allowUrl ? urlParams.get(paramName) : null;
	const validatedSearchParam = typeof validate === 'function'
		? validate(searchParam)
		: searchParam;
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (validatedSearchParam) {
		storage.setItem(storageKey, validatedSearchParam);
		return validatedSearchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = allowStored ? storage.getItem(storageKey) : null;
	if (storedValue) {
		const validatedStoredValue = typeof validate === 'function'
			? validate(storedValue)
			: storedValue;

		if (validatedStoredValue) {
			return validatedStoredValue;
		}

		// Purge invalid or untrusted values so they don't linger in storage
		storage.removeItem(storageKey);
	} else if (!allowStored) {
		storage.removeItem(storageKey);
	}
	return null;
}

const isLikelyJwt = (value) => {
	if (!value || typeof value !== 'string') {
		return null;
	}

	// JWTs should be a reasonable length and contain three segments
	if (value.length > 5000 || value.split('.').length !== 3) {
		return null;
	}

	return value;
}

const getAppParams = () => {
	const allowSensitiveUrlParams = isTopLevelWindow && isSecureEnvironment;

	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", {
			removeFromUrl: true,
			allowUrl: allowSensitiveUrlParams,
			allowStored: allowSensitiveUrlParams,
			validate: isLikelyJwt
		}),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
	}
}


export const appParams = {
	...getAppParams()
}
