(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/app/dist/esm/definitions.js
  var init_definitions = __esm({
    "node_modules/@capacitor/app/dist/esm/definitions.js"() {
    }
  });

  // node_modules/@capacitor/app/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    AppWeb: () => AppWeb
  });
  var AppWeb;
  var init_web = __esm({
    "node_modules/@capacitor/app/dist/esm/web.js"() {
      init_dist();
      AppWeb = class extends WebPlugin {
        constructor() {
          super();
          this.handleVisibilityChange = () => {
            const data = {
              isActive: document.hidden !== true
            };
            this.notifyListeners("appStateChange", data);
            if (document.hidden) {
              this.notifyListeners("pause", null);
            } else {
              this.notifyListeners("resume", null);
            }
          };
          document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
        }
        exitApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getInfo() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getLaunchUrl() {
          return { url: "" };
        }
        async getState() {
          return { isActive: document.hidden !== true };
        }
        async minimizeApp() {
          throw this.unimplemented("Not implemented on web.");
        }
        async toggleBackButtonHandler() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // node_modules/@capacitor/app/dist/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    App: () => App
  });
  var App;
  var init_esm = __esm({
    "node_modules/@capacitor/app/dist/esm/index.js"() {
      init_dist();
      init_definitions();
      App = registerPlugin("App", {
        web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.AppWeb())
      });
    }
  });

  // src/App.jsx
  var import_react = __require("react");
  var import_PomodoroTimer = __toESM(__require("./components/PomodoroTimer"));
  var import_TaskImportExport = __toESM(__require("./components/TaskImportExport"));
  var import_useKeyboardShortcuts = __toESM(__require("./hooks/useKeyboardShortcuts"));
  var import_useMobileFeatures = __require("./hooks/useMobileFeatures");
  var import_notifications = __require("./notifications.fixed");
  var import_App = __require("./App.css");
  var import_SharedUI = __require("./components/SharedUI");
  var import_ShortcutsModal = __toESM(__require("./components/ShortcutsModal"));
  var import_AchievementBadges = __toESM(__require("./components/AchievementBadges"));
  var import_WeeklyPlannerWizard = __toESM(__require("./components/WeeklyPlannerWizard"));
  var import_TaskTemplates = __toESM(__require("./components/TaskTemplates"));
  var import_deviceSettings = __require("./plugins/deviceSettings");
  var import_constants = __require("./utils/constants");
  var import_helpers = __require("./utils/helpers");
  var DashboardView = (0, import_react.lazy)(() => import("./views/DashboardView"));
  var TasksView = (0, import_react.lazy)(() => import("./views/TasksView"));
  var PlannerView = (0, import_react.lazy)(() => import("./views/PlannerView"));
  var AnalyticsView = (0, import_react.lazy)(() => import("./views/AnalyticsView"));
  var SettingsView = (0, import_react.lazy)(() => import("./views/SettingsView"));
  var CareerView = (0, import_react.lazy)(() => import("./views/CareerView"));
  var ToolsView = (0, import_react.lazy)(() => import("./views/ToolsView"));
  var HabitsView = (0, import_react.lazy)(() => import("./views/HabitsView"));
  var JournalView = (0, import_react.lazy)(() => import("./views/JournalView"));
  var GoalsView = (0, import_react.lazy)(() => import("./views/GoalsView"));
  function App2() {
    const electronIpc = (0, import_react.useMemo)(() => {
      try {
        return window.require?.("electron")?.ipcRenderer ?? null;
      } catch {
        return null;
      }
    }, []);
    const [userName, setUserName] = (0, import_react.useState)("");
    const [showNameSetup, setShowNameSetup] = (0, import_react.useState)(false);
    const [tempName, setTempName] = (0, import_react.useState)("");
    const [goals, setGoals] = (0, import_react.useState)([]);
    const [loaded, setLoaded] = (0, import_react.useState)(false);
    const [showForm, setShowForm] = (0, import_react.useState)(false);
    const [aiLoading, setAiLoading] = (0, import_react.useState)(false);
    const [editingGoal, setEditingGoal] = (0, import_react.useState)(null);
    const [activeDate, setActiveDate] = (0, import_react.useState)((0, import_helpers.todayKey)());
    const [weekBase, setWeekBase] = (0, import_react.useState)(/* @__PURE__ */ new Date());
    const [activeView, setActiveView] = (0, import_react.useState)("tasks");
    const [notifPerm, setNotifPerm] = (0, import_react.useState)("default");
    const [priorityFilter, setPriorityFilter] = (0, import_react.useState)("All");
    const [timeFilter, setTimeFilter] = (0, import_react.useState)("All Times");
    const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
    const [themeMode, setThemeMode] = (0, import_react.useState)("dark");
    const [autoThemeMode, setAutoThemeMode] = (0, import_react.useState)("off");
    const [appLanguage, setAppLanguage] = (0, import_react.useState)("en");
    const [taskFontSize, setTaskFontSize] = (0, import_react.useState)(18);
    const [taskFontFamily, setTaskFontFamily] = (0, import_react.useState)(import_constants.FONT_OPTIONS[0].value);
    const [uiScale, setUiScale] = (0, import_react.useState)(96);
    const [overdueEnabled, setOverdueEnabled] = (0, import_react.useState)(true);
    const [fontWeight, setFontWeight] = (0, import_react.useState)(500);
    const [soundTheme, setSoundTheme] = (0, import_react.useState)("default");
    const [hapticEnabled, setHapticEnabled] = (0, import_react.useState)(true);
    const [liveHighlightEnabled, setLiveHighlightEnabled] = (0, import_react.useState)(true);
    const [reminderPopup, setReminderPopup] = (0, import_react.useState)(null);
    const [liveTaskPopup, setLiveTaskPopup] = (0, import_react.useState)(null);
    const [nextTaskAlert, setNextTaskAlert] = (0, import_react.useState)(null);
    const [form, setForm] = (0, import_react.useState)({ text: "", date: (0, import_helpers.todayKey)(), reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
    const [completedPulseId, setCompletedPulseId] = (0, import_react.useState)(null);
    const [celebratingGoalId, setCelebratingGoalId] = (0, import_react.useState)(null);
    const [selectedGoalIds, setSelectedGoalIds] = (0, import_react.useState)([]);
    const [plannerView, setPlannerView] = (0, import_react.useState)("monthly");
    const [showPomodoro, setShowPomodoro] = (0, import_react.useState)(false);
    const [showImportExport, setShowImportExport] = (0, import_react.useState)(false);
    const [focusMode, setFocusMode] = (0, import_react.useState)(false);
    const [upcomingTaskAlert, setUpUpcomingTaskAlert] = (0, import_react.useState)(null);
    const [showCelebration, setShowCelebration] = (0, import_react.useState)(false);
    const [nextUpcomingTask, setNextUpcomingTask] = (0, import_react.useState)(null);
    const [nowTick, setNowTick] = (0, import_react.useState)(Date.now());
    const [nowMinuteTick, setNowMinuteTick] = (0, import_react.useState)(Date.now());
    const [showShortcuts, setShowShortcuts] = (0, import_react.useState)(false);
    const [journalEntries, setJournalEntries] = (0, import_react.useState)({});
    const [showWeeklyWizard, setShowWeeklyWizard] = (0, import_react.useState)(false);
    const [habitsData, setHabitsData] = (0, import_react.useState)([]);
    const [goalsData, setGoalsData] = (0, import_react.useState)([]);
    const [tabSwitching, setTabSwitching] = (0, import_react.useState)(false);
    const [showMoreMenu, setShowMoreMenu] = (0, import_react.useState)(false);
    const [aiContext, setAiContext] = (0, import_react.useState)("");
    (0, import_useMobileFeatures.useMobileFeatures)({ themeMode, activeView, setActiveView, setShowForm, setShowMoreMenu });
    const touchStartX = (0, import_react.useRef)(null);
    const touchStartY = (0, import_react.useRef)(null);
    const liveTaskRef = (0, import_react.useRef)();
    const nextAlertShownRef = (0, import_react.useRef)({});
    const pendingWriteRef = (0, import_react.useRef)({ last: "[]", timer: null });
    const handleGlobalTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleGlobalTouchEnd = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchStartX.current - touchEndX;
      const deltaY = touchStartY.current - touchEndY;
      const screenW = window.innerWidth;
      const startX = touchStartX.current;
      touchStartX.current = null;
      touchStartY.current = null;
      const EDGE = screenW * 0.22;
      if (startX > EDGE && startX < screenW - EDGE) return;
      const THRESHOLD = 140;
      if (Math.abs(deltaX) < THRESHOLD) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 0.25) return;
      const t = e.target;
      if (t.closest(".goal-item") || t.closest(".swipeable-task-container") || t.closest(".filters") || t.closest(".modal") || t.closest(".overlay") || t.closest(".live-strip") || t.closest(".tab-nav") || t.closest("input") || t.closest("textarea") || t.closest("select") || t.closest("button")) return;
      const tabs = ["insights", "tasks", "planner", "analytics", "settings", "career", "tools", "habits", "journal", "goals"];
      const idx = tabs.indexOf(activeView);
      if (idx === -1) return;
      if (deltaX > THRESHOLD && idx < tabs.length - 1) {
        (0, import_useMobileFeatures.triggerHaptic)("light");
        setActiveView(tabs[idx + 1]);
      } else if (deltaX < -THRESHOLD && idx > 0) {
        (0, import_useMobileFeatures.triggerHaptic)("light");
        setActiveView(tabs[idx - 1]);
      }
    };
    const pulseTimerRef = (0, import_react.useRef)(null);
    const celebrateTimerRef = (0, import_react.useRef)(null);
    const masterTimerRef = (0, import_react.useRef)(null);
    const searchRef = (0, import_react.useRef)(null);
    const quote = (0, import_react.useMemo)(() => import_constants.QUOTES[Math.floor(Date.now() / 864e5 % import_constants.QUOTES.length)], []);
    (0, import_react.useEffect)(() => {
      const storedName = localStorage.getItem("taskPlanner_userName");
      if (storedName) setUserName(storedName);
      else setShowNameSetup(true);
    }, []);
    const copy = (0, import_react.useMemo)(() => import_constants.APP_COPY[appLanguage] || import_constants.APP_COPY.en, [appLanguage]);
    const visibleGoals = (0, import_react.useMemo)(() => {
      const term = searchTerm.trim().toLowerCase();
      return goals.filter((g) => (0, import_helpers.goalVisibleOn)(g, activeDate)).filter((g) => priorityFilter === "All" ? true : g.priority === priorityFilter).filter((g) => (0, import_helpers.matchesTimeFilter)(g, timeFilter)).filter((g) => term ? g.text.toLowerCase().includes(term) : true).sort((a, b) => import_constants.PRIORITY_RANK[a.priority] - import_constants.PRIORITY_RANK[b.priority] || (0, import_helpers.timeToMinutes)(a.startTime) - (0, import_helpers.timeToMinutes)(b.startTime) || (0, import_helpers.timeToMinutes)(a.reminder) - (0, import_helpers.timeToMinutes)(b.reminder) || a.id - b.id);
    }, [goals, activeDate, priorityFilter, searchTerm, timeFilter]);
    const pendingGoals = (0, import_react.useMemo)(() => visibleGoals.filter((g) => !(0, import_helpers.isDoneOn)(g, activeDate)), [visibleGoals, activeDate]);
    const completedGoals = (0, import_react.useMemo)(() => visibleGoals.filter((g) => (0, import_helpers.isDoneOn)(g, activeDate)), [visibleGoals, activeDate]);
    const selectedSet = (0, import_react.useMemo)(() => new Set(selectedGoalIds), [selectedGoalIds]);
    const nowMinutes = (0, import_react.useMemo)(() => {
      const now = new Date(nowMinuteTick);
      return now.getHours() * 60 + now.getMinutes();
    }, [nowMinuteTick]);
    const liveCurrentGoal = (0, import_react.useMemo)(() => [...goals].filter((g) => (0, import_helpers.goalVisibleOn)(g, (0, import_helpers.todayKey)())).filter((g) => !(0, import_helpers.isDoneOn)(g, (0, import_helpers.todayKey)())).sort((a, b) => (0, import_helpers.goalTimeMinutes)(a) - (0, import_helpers.goalTimeMinutes)(b)).find((g) => (0, import_helpers.isTimeLiveNow)(g.startTime, g.endTime, nowMinutes)) || null, [goals, nowMinutes]);
    const nextUpcomingGoal = (0, import_react.useMemo)(() => {
      return [...goals].filter((g) => (0, import_helpers.goalVisibleOn)(g, (0, import_helpers.todayKey)())).filter((g) => !(0, import_helpers.isDoneOn)(g, (0, import_helpers.todayKey)())).filter((g) => g.id !== liveCurrentGoal?.id).filter((g) => g.startTime && (0, import_helpers.timeToMinutes)(g.startTime) >= nowMinutes).sort((a, b) => (0, import_helpers.timeToMinutes)(a.startTime) - (0, import_helpers.timeToMinutes)(b.startTime))[0] || null;
    }, [goals, nowMinutes, liveCurrentGoal]);
    const liveCountdown = (0, import_react.useMemo)(() => {
      if (!liveCurrentGoal?.endTime) return null;
      const remaining = (0, import_helpers.getTimeRemainingMs)(liveCurrentGoal.endTime);
      return remaining !== null ? (0, import_helpers.formatCountdown)(remaining) : null;
    }, [liveCurrentGoal, nowTick]);
    const shouldShowNextAlert = (0, import_react.useMemo)(() => {
      if (!liveCurrentGoal?.endTime) return false;
      const remaining = (0, import_helpers.getTimeRemainingMs)(liveCurrentGoal.endTime);
      return remaining !== null && Math.floor(remaining / 6e4) === 5;
    }, [liveCurrentGoal, nowTick]);
    const liveClockLabel = (0, import_react.useMemo)(() => new Date(nowTick).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).toUpperCase(), [nowTick]);
    const done = goals.filter((g) => (0, import_helpers.goalVisibleOn)(g, activeDate) && (0, import_helpers.isDoneOn)(g, activeDate)).length;
    const total = goals.filter((g) => (0, import_helpers.goalVisibleOn)(g, activeDate)).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const dueSoon = goals.filter((g) => (0, import_helpers.goalVisibleOn)(g, activeDate) && !(0, import_helpers.isDoneOn)(g, activeDate) && (0, import_helpers.timeToMinutes)(g.reminder) < Number.MAX_SAFE_INTEGER).length;
    const weekly = (0, import_react.useMemo)(() => (0, import_helpers.weeklyStats)(goals), [goals]);
    const streakDays = (0, import_react.useMemo)(() => (0, import_helpers.completionStreak)(goals), [goals]);
    (0, import_react.useEffect)(() => {
      masterTimerRef.current = setInterval(() => setNowTick(Date.now()), 1e3);
      const minuteTimer = setInterval(() => setNowMinuteTick(Date.now()), 6e4);
      return () => {
        clearInterval(masterTimerRef.current);
        clearInterval(minuteTimer);
      };
    }, []);
    const globalCelebrationTimerRef = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      return () => {
        clearTimeout(pulseTimerRef.current);
        clearTimeout(celebrateTimerRef.current);
        clearTimeout(globalCelebrationTimerRef.current);
        if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer);
      };
    }, []);
    (0, import_react.useEffect)(() => {
      setTabSwitching(true);
      const t = setTimeout(() => setTabSwitching(false), 200);
      return () => clearTimeout(t);
    }, [activeView]);
    (0, import_react.useEffect)(() => {
      const loadInitData = async () => {
        const [raw, uiState, prefs, journalRaw, habitsRaw, goalsRaw] = await Promise.all([
          (0, import_helpers.readStorage)(),
          (0, import_helpers.readUiState)(),
          (0, import_helpers.readPrefs)(),
          (0, import_helpers.readPersist)(import_constants.JOURNAL_KEY),
          (0, import_helpers.readPersist)(import_constants.HABITS_KEY),
          (0, import_helpers.readPersist)(import_constants.GOALS_KEY)
        ]);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setGoals(parsed.map(import_helpers.normalizeGoal));
          } catch {
          }
        }
        if (uiState && typeof uiState === "object") {
          setActiveDate((0, import_helpers.todayKey)());
          if (uiState.activeView) setActiveView(uiState.activeView);
          if (uiState.searchTerm) setSearchTerm(uiState.searchTerm);
          if (uiState.priorityFilter) setPriorityFilter(uiState.priorityFilter);
          if (uiState.timeFilter) setTimeFilter(uiState.timeFilter);
          setWeekBase(/* @__PURE__ */ new Date());
        }
        if (prefs) {
          setThemeMode(prefs.themeMode || (prefs.darkMode ? "dark" : "sunset-light"));
          if (prefs.autoThemeMode) setAutoThemeMode(prefs.autoThemeMode);
          if (prefs.appLanguage) setAppLanguage(prefs.appLanguage);
          setTaskFontSize(Number(prefs.taskFontSize) || 18);
          setTaskFontFamily(prefs.taskFontFamily || import_constants.FONT_OPTIONS[0].value);
          setUiScale(Number(prefs.uiScale) || 96);
          if (typeof prefs.overdueEnabled === "boolean") setOverdueEnabled(prefs.overdueEnabled);
          if (prefs.fontWeight) setFontWeight(Number(prefs.fontWeight) || 500);
          if (prefs.soundTheme) setSoundTheme(prefs.soundTheme);
          if (typeof prefs.hapticEnabled === "boolean") setHapticEnabled(prefs.hapticEnabled);
          if (typeof prefs.liveHighlightEnabled === "boolean") setLiveHighlightEnabled(prefs.liveHighlightEnabled);
        }
        if (journalRaw) {
          try {
            setJournalEntries(JSON.parse(journalRaw));
          } catch {
          }
        }
        if (habitsRaw) {
          try {
            setHabitsData(JSON.parse(habitsRaw));
          } catch {
          }
        }
        if (goalsRaw) {
          try {
            setGoalsData(JSON.parse(goalsRaw));
          } catch {
          }
        }
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("view") === "tasks") setActiveView("tasks");
        setLoaded(true);
        (0, import_notifications.initializeNotifications)().then(setNotifPerm);
        if ((0, import_notifications.getNotificationPermission)() === "default") (0, import_notifications.requestNotificationPermission)().then(setNotifPerm);
      };
      loadInitData();
    }, []);
    (0, import_react.useEffect)(() => {
      if (!loaded) return;
      (0, import_helpers.writeUiState)({ activeDate, activeView, searchTerm, priorityFilter, timeFilter, weekBase: weekBase instanceof Date ? weekBase.toISOString() : (/* @__PURE__ */ new Date()).toISOString() });
      (0, import_helpers.writePrefs)({ themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled });
      (0, import_notifications.scheduleTaskNotifications)(goals);
    }, [activeDate, activeView, loaded, priorityFilter, searchTerm, timeFilter, weekBase, themeMode, autoThemeMode, appLanguage, taskFontSize, taskFontFamily, uiScale, overdueEnabled, fontWeight, soundTheme, hapticEnabled, liveHighlightEnabled, goals]);
    const save = (0, import_react.useCallback)((updated) => {
      setGoals(updated);
      let serialized = "[]";
      try {
        serialized = JSON.stringify(updated);
      } catch {
      }
      pendingWriteRef.current.last = serialized;
      if (pendingWriteRef.current.timer) clearTimeout(pendingWriteRef.current.timer);
      pendingWriteRef.current.timer = setTimeout(() => {
        (0, import_helpers.writeStorage)(pendingWriteRef.current.last).catch(() => {
        });
      }, 300);
    }, []);
    (0, import_react.useEffect)(() => {
      if (!electronIpc?.send) return;
      electronIpc.send("schedule-reminders", goals);
    }, [electronIpc, goals, loaded]);
    (0, import_react.useEffect)(() => {
      if (!electronIpc?.send) return;
      electronIpc.send("update-tray-task", liveCurrentGoal?.text || "No live task right now");
    }, [electronIpc, liveCurrentGoal]);
    (0, import_react.useEffect)(() => {
      if (!electronIpc?.on) return void 0;
      const handler = (_event, payload) => setReminderPopup(payload);
      electronIpc.on("reminder-fired", handler);
      return () => electronIpc.removeListener?.("reminder-fired", handler);
    }, [electronIpc]);
    (0, import_react.useEffect)(() => {
      if (!liveHighlightEnabled) return;
      if (!liveCurrentGoal?.id) {
        liveTaskRef.current = void 0;
        return;
      }
      if (liveTaskRef.current === liveCurrentGoal.id) return;
      liveTaskRef.current = liveCurrentGoal.id;
      setLiveTaskPopup(liveCurrentGoal);
      electronIpc?.send?.("notify-task-shift", {
        text: liveCurrentGoal.text,
        startTime: liveCurrentGoal.startTime,
        endTime: liveCurrentGoal.endTime,
        session: liveCurrentGoal.session
      });
    }, [electronIpc, liveCurrentGoal, liveHighlightEnabled]);
    (0, import_react.useEffect)(() => {
      if (autoThemeMode === "off") return void 0;
      const applyTheme = () => {
        if (autoThemeMode === "time") {
          const hour = (/* @__PURE__ */ new Date()).getHours();
          setThemeMode(hour >= 18 || hour < 6 ? "dark" : "sunset-light");
          return;
        }
        const media = window.matchMedia?.("(prefers-color-scheme: dark)");
        setThemeMode(media?.matches ? "dark" : "sunset-light");
      };
      applyTheme();
      if (autoThemeMode === "system" && window.matchMedia) {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener?.("change", applyTheme);
        return () => media.removeEventListener?.("change", applyTheme);
      }
      const timer = autoThemeMode === "time" ? setInterval(applyTheme, 6e4) : null;
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [autoThemeMode]);
    (0, import_react.useEffect)(() => {
      if (!loaded) return void 0;
      const refreshNotifications = () => {
        (0, import_notifications.scheduleTaskNotifications)(goals);
        electronIpc?.send?.("schedule-reminders", goals);
      };
      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden" || document.visibilityState === "visible") {
          refreshNotifications();
        }
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      let cleanup = () => {
      };
      if (window.Capacitor) {
        Promise.resolve().then(() => (init_esm(), esm_exports)).then(async ({ App: App3 }) => {
          const listener = await App3.addListener("appStateChange", ({ isActive }) => {
            refreshNotifications();
            if (isActive) (0, import_notifications.initializeNotifications)().then(setNotifPerm);
          });
          cleanup = () => listener.remove();
        }).catch(() => {
        });
      }
      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        cleanup();
      };
    }, [electronIpc, goals, loaded]);
    const calculateNextUpcomingTask = (0, import_react.useCallback)(() => {
      const currentTime = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
      const today = (0, import_helpers.todayKey)();
      return goals.filter((task) => (0, import_helpers.goalVisibleOn)(task, today) && !(0, import_helpers.isDoneOn)(task, today) && task.startTime && task.startTime > currentTime).sort((a, b) => a.startTime.localeCompare(b.startTime))[0] || null;
    }, [goals]);
    (0, import_react.useEffect)(() => {
      const interval = setInterval(() => {
        const nextTask = calculateNextUpcomingTask();
        if (nextTask) {
          const timeUntilStart = /* @__PURE__ */ new Date(`${nextTask.date}T${nextTask.startTime}`) - /* @__PURE__ */ new Date();
          if (timeUntilStart <= 3e5 && timeUntilStart > 0) {
            if (!nextAlertShownRef.current[nextTask.id]) {
              setUpUpcomingTaskAlert(nextTask);
              import_helpers.AudioPlayer.playReminder();
              nextAlertShownRef.current[nextTask.id] = true;
            }
          }
        }
      }, 3e4);
      return () => clearInterval(interval);
    }, [calculateNextUpcomingTask]);
    (0, import_react.useEffect)(() => {
      setNextUpcomingTask(calculateNextUpcomingTask());
    }, [calculateNextUpcomingTask]);
    const aiBriefing = (0, import_react.useMemo)(() => {
      const today = (0, import_helpers.todayKey)();
      const pGoals = goals.filter((g) => (0, import_helpers.goalVisibleOn)(g, today) && !(0, import_helpers.isDoneOn)(g, today));
      const highPriority = pGoals.filter((goal) => goal.priority === "High").slice(0, 2);
      const untimed = pGoals.filter((goal) => !goal.startTime).slice(0, 2);
      const overdue = pGoals.filter((goal) => goal.endTime && (0, import_helpers.timeToMinutes)(goal.endTime) < nowMinutes);
      return {
        headline: liveCurrentGoal ? `${copy.ai.stayLocked} "${liveCurrentGoal.text}" ${copy.ai.until} ${liveCurrentGoal.endTime || liveCurrentGoal.startTime || "the next block"}.` : nextUpcomingGoal ? `${copy.ai.prepFor} "${nextUpcomingGoal.text}" ${copy.ai.before} ${nextUpcomingGoal.startTime}.` : copy.ai.boardOpen,
        risk: overdue.length ? `${overdue.length} ${overdue.length > 1 ? copy.ai.overdueNow : copy.ai.overdueSingle}` : highPriority.length ? `${copy.ai.highPriorityWaiting} ${highPriority.map((goal) => goal.text).join(", ")}.` : copy.ai.noUrgent,
        suggestion: untimed.length ? `${copy.ai.assignSlots} ${untimed.map((goal) => goal.text).join(", ")}.` : pGoals.length ? copy.ai.goodStructure : copy.ai.dayClear
      };
    }, [copy.ai, liveCurrentGoal, nextUpcomingGoal, nowMinutes, goals]);
    const aiWeeklyAnalysis = (0, import_react.useMemo)(() => {
      const isTamil = appLanguage === "ta";
      const bestDay = weekly.bestDay?.name || "N/A";
      const weakestDay = weekly.days.reduce((lowest, day) => !lowest || day.pct < lowest.pct ? day : lowest, null)?.name || "N/A";
      const totalPending = goals.filter((goal) => !(0, import_helpers.isDoneOn)(goal, (0, import_helpers.todayKey)()) && (0, import_helpers.goalVisibleOn)(goal, (0, import_helpers.todayKey)())).length;
      const completionTrend = weekly.days.map((day) => day.pct < 0 ? 0 : day.pct);
      const trendDelta = completionTrend.length > 1 ? completionTrend[completionTrend.length - 1] - completionTrend[0] : 0;
      const predictedPct = Math.max(20, Math.min(100, Math.round(weekly.weekPct + trendDelta * 0.35)));
      const overloadedDays = weekly.days.filter((day) => day.total >= 6);
      const burnoutRisk = overloadedDays.length >= 3 || weekly.weekPct < 45 && weekly.weekTotal >= 12 ? "high" : overloadedDays.length >= 1 ? "medium" : "low";
      const overdueTasks = goals.filter((goal) => (0, import_helpers.goalVisibleOn)(goal, (0, import_helpers.todayKey)()) && !(0, import_helpers.isDoneOn)(goal, (0, import_helpers.todayKey)()) && goal.endTime && (0, import_helpers.timeToMinutes)(goal.endTime) < nowMinutes);
      const untimedPending = goals.filter((goal) => (0, import_helpers.goalVisibleOn)(goal, (0, import_helpers.todayKey)()) && !(0, import_helpers.isDoneOn)(goal, (0, import_helpers.todayKey)()) && !goal.startTime);
      const pendingPriority = goals.filter((goal) => (0, import_helpers.goalVisibleOn)(goal, (0, import_helpers.todayKey)()) && !(0, import_helpers.isDoneOn)(goal, (0, import_helpers.todayKey)())).sort((a, b) => import_constants.PRIORITY_RANK[a.priority] - import_constants.PRIORITY_RANK[b.priority]);
      const recurringSource = goals.filter((goal) => goal.repeat !== "None").slice(0, 3);
      const sourceTitles = [
        ...pendingPriority.map((goal) => goal.text),
        ...recurringSource.map((goal) => goal.text),
        "Deep work block",
        "Weekly review and planning",
        "Admin cleanup",
        "Learning sprint",
        "Recovery buffer"
      ].filter(Boolean);
      const nextWeekDates = buildNextWeekDates();
      const preferredSlots = [
        { startTime: "08:30", endTime: "10:00", priority: "High", session: "Morning" },
        { startTime: "10:30", endTime: "11:30", priority: "Medium", session: "Morning" },
        { startTime: "13:00", endTime: "14:30", priority: "High", session: "Afternoon" },
        { startTime: "15:30", endTime: "16:30", priority: "Medium", session: "Afternoon" },
        { startTime: "17:00", endTime: "17:30", priority: "Low", session: "Evening" }
      ];
      const nextWeekTaskDrafts = nextWeekDates.map((dateKey, index) => {
        const slot = preferredSlots[index % preferredSlots.length];
        const text = sourceTitles[index % sourceTitles.length];
        return (0, import_helpers.normalizeGoal)({
          id: Date.now() + index,
          text: text.includes("block") || text.includes("review") || text.includes("cleanup") || text.includes("sprint") || text.includes("buffer") ? text : `${text} focus block`,
          date: dateKey,
          startTime: slot.startTime,
          endTime: slot.endTime,
          reminder: shiftTime(slot.startTime, -15),
          priority: slot.priority,
          session: slot.session,
          repeat: "None"
        });
      });
      const nextWeekPlan = [
        {
          title: copy.analytics.workloadBalance,
          detail: isTamil ? `${bestDay} \u0BA8\u0BBE\u0BB3\u0BC8 deep work \u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD, ${weakestDay} \u0BA8\u0BBE\u0BB3\u0BC8 admin, review, recovery \u0BAE\u0BBE\u0BA4\u0BBF\u0BB0\u0BBF \u0BB2\u0BC7\u0B9A\u0BBE\u0BA9 \u0BAA\u0BA3\u0BBF\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0BB5\u0BC8\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.` : `Use ${bestDay} for deep work and keep ${weakestDay} lighter with admin, review, or recovery tasks.`
        },
        {
          title: copy.analytics.focusTime,
          detail: untimedPending.length ? isTamil ? `${Math.min(untimedPending.length, 3)} untimed task-\u0B95\u0BB3\u0BC8 \u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BB5\u0BBE\u0BB0\u0BAE\u0BCD \u0B95\u0BBE\u0BB2\u0BC8 focus block-\u0B86\u0B95 \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.` : `Convert ${Math.min(untimedPending.length, 3)} untimed task${untimedPending.length > 1 ? "s" : ""} into morning focus blocks next week.` : isTamil ? "\u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BB5\u0BBE\u0BB0\u0BAE\u0BCD \u0BAE\u0BA4\u0BBF\u0BAF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 \u0BAE\u0BC1\u0BA9\u0BCD \u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1 \u0BAE\u0BC2\u0BA9\u0BCD\u0BB1\u0BC1 90 \u0BA8\u0BBF\u0BAE\u0BBF\u0B9F focus blocks \u0BAA\u0BBE\u0BA4\u0BC1\u0B95\u0BBE\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD." : "Protect at least three 90-minute focus blocks next week before noon."
        },
        {
          title: copy.analytics.burnoutRisk,
          detail: burnoutRisk === "high" ? isTamil ? "\u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC1 \u0B85\u0BAA\u0BBE\u0BAF\u0BAE\u0BCD \u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BCD. \u0B92\u0BB0\u0BC1 buffer evening \u0BB5\u0BC8\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD, \u0B95\u0B9F\u0BBF\u0BA9 \u0BAA\u0BA3\u0BBF\u0B95\u0BB3\u0BC8 \u0B95\u0BC1\u0BB1\u0BC8\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD, \u0BA4\u0BBF\u0BA9\u0BAE\u0BC1\u0BAE\u0BCD 2 heavy blocks \u0B95\u0BCD\u0B95\u0BC1 \u0BAE\u0BC7\u0BB2\u0BCD \u0B9A\u0BC7\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BBE\u0BA4\u0BC0\u0BB0\u0BCD\u0B95\u0BB3\u0BCD." : "Burnout risk is high. Add one buffer evening, reduce hard tasks, and avoid stacking more than 2 heavy blocks a day." : burnoutRisk === "medium" ? isTamil ? "\u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC1 \u0B85\u0BAA\u0BBE\u0BAF\u0BAE\u0BCD \u0BA8\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BB0\u0BAE\u0BBE\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0B95\u0B9F\u0BBF\u0BA9 \u0BAA\u0BA3\u0BBF\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BA8\u0B9F\u0BC1\u0BB5\u0BBF\u0BB2\u0BCD \u0BB2\u0BC7\u0B9A\u0BBE\u0BA9 review \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 admin blocks \u0BB5\u0BC8\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD." : "Burnout risk is moderate. Space demanding work with lighter review or admin blocks." : isTamil ? "\u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC1 \u0B85\u0BAA\u0BBE\u0BAF\u0BAE\u0BCD \u0B95\u0BC1\u0BB1\u0BC8\u0BB5\u0BBE\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0BA8\u0BB2\u0BCD\u0BB2 \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BC8 \u0B95\u0BC2\u0B9F \u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BBE\u0B95 \u0BA8\u0BBF\u0BB0\u0BAA\u0BCD\u0BAA\u0BBE\u0BAE\u0BB2\u0BCD steady pace \u0BB5\u0BC8\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD." : "Burnout risk looks low. Keep the pace steady without overfilling strong days."
        },
        {
          title: copy.analytics.cleanup,
          detail: overdueTasks.length ? isTamil ? `\u0BAA\u0BC1\u0BA4\u0BBF\u0BAF \u0BB5\u0BC7\u0BB2\u0BC8 \u0B9A\u0BC7\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BA4\u0BB1\u0BCD\u0B95\u0BC1 \u0BAE\u0BC1\u0BA9\u0BCD ${overdueTasks.length} overdue task-\u0B95\u0BB3\u0BC8 clear \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 reschedule \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.` : `Clear or reschedule ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} before adding new work.` : isTamil ? "\u0B87\u0BAA\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1 overdue cleanup \u0B85\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BAE\u0BCD \u0B87\u0BB2\u0BCD\u0BB2\u0BC8. \u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BB5\u0BBE\u0BB0\u0BA4\u0BCD\u0BA4\u0BC8 clean board \u0B89\u0B9F\u0BA9\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BB2\u0BBE\u0BAE\u0BCD." : "No overdue cleanup pressure right now. You can start next week with a clean board."
        }
      ];
      return {
        summary: weekly.weekTotal ? isTamil ? `\u0B87\u0BA8\u0BCD\u0BA4 \u0BB5\u0BBE\u0BB0\u0BAE\u0BCD ${weekly.weekTotal} visible task-\u0B95\u0BB3\u0BBF\u0BB2\u0BCD ${weekly.weekDone} \u0BAE\u0BC1\u0B9F\u0BBF\u0BA4\u0BCD\u0BA4\u0BC1\u0BB3\u0BCD\u0BB3\u0BC0\u0BB0\u0BCD\u0B95\u0BB3\u0BCD. \u0B9A\u0BC1\u0BAE\u0BBE\u0BB0\u0BCD ${weekly.weekPct}%.` : `You finished ${weekly.weekDone} of ${weekly.weekTotal} visible tasks this week, around ${weekly.weekPct}%.` : isTamil ? "\u0B87\u0BA8\u0BCD\u0BA4 \u0BB5\u0BBE\u0BB0\u0BA4\u0BCD\u0BA4\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 tracked data \u0B95\u0BC1\u0BB1\u0BC8\u0BB5\u0BC1. \u0BA4\u0BBF\u0BA9\u0B9A\u0BB0\u0BBF task logging \u0B9A\u0BC6\u0BAF\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD analysis \u0B87\u0BA9\u0BCD\u0BA9\u0BC1\u0BAE\u0BCD \u0BA8\u0BB2\u0BCD\u0BB2\u0BA4\u0BBE\u0B95\u0BC1\u0BAE\u0BCD." : "This week has very little tracked data. Start logging tasks daily for stronger analysis.",
        momentum: streakDays >= 3 ? isTamil ? `\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD streak ${streakDays} \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD. \u0B87\u0BA4\u0BC8 \u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BBE\u0BB1\u0BCD\u0BB1 \u0BA8\u0BBE\u0BB3\u0BC8\u0B95\u0BCD\u0B95\u0BC1 \u0BB2\u0BC7\u0B9A\u0BBE\u0BA9 \u0B86\u0BA9\u0BBE\u0BB2\u0BCD consistent \u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD \u0BB5\u0BC8\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.` : `Your streak is ${streakDays} days. Protect it with a light but consistent tomorrow plan.` : isTamil ? "Momentum \u0B87\u0BA9\u0BCD\u0BA9\u0BC1\u0BAE\u0BCD build \u0B86\u0B95\u0BBF\u0BB1\u0BA4\u0BC1. \u0B92\u0BB0\u0BC1 \u0BA8\u0BBE\u0BB3\u0BBF\u0BB2\u0BCD \u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BCD push \u0B9A\u0BC6\u0BAF\u0BCD\u0BB5\u0BA4\u0BB1\u0BCD\u0B95\u0BC1\u0BAA\u0BCD \u0BAA\u0BA4\u0BBF\u0BB2\u0BBE\u0B95 \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF consistent wins \u0B89\u0BA4\u0BB5\u0BC1\u0BAE\u0BCD." : "Momentum is still building. Small repeatable wins will help more than heavy one-day pushes.",
        pattern: isTamil ? `\u0B9A\u0BBF\u0BB1\u0BA8\u0BCD\u0BA4 \u0BA8\u0BBE\u0BB3\u0BCD: ${bestDay}. \u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4 output \u0BA8\u0BBE\u0BB3\u0BCD: ${weakestDay}. \u0B87\u0BA9\u0BCD\u0BB1\u0BC1 pending: ${totalPending}.` : `Best day: ${bestDay}. Lowest output day: ${weakestDay}. Pending today: ${totalPending}.`,
        advice: weekly.weekPct >= 80 ? isTamil ? "\u0B87\u0BAA\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1 overload \u0B95\u0BC1\u0BB1\u0BC8\u0BA4\u0BCD\u0BA4\u0BC1 deep-work quality \u0BAE\u0BC0\u0BA4\u0BC1 \u0B95\u0BB5\u0BA9\u0BAE\u0BCD \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BBE\u0BAE\u0BCD." : "You can now reduce overload and focus more on deep-work quality." : weekly.weekPct >= 50 ? isTamil ? "Completion \u0BA8\u0BB2\u0BCD\u0BB2 \u0BA8\u0BBF\u0BB2\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0B86\u0BA9\u0BBE\u0BB2\u0BCD top priorities-\u0B90 \u0B87\u0BA9\u0BCD\u0BA9\u0BC1\u0BAE\u0BCD \u0BAE\u0BC1\u0BA9\u0BCD\u0BAA\u0BC7 time-block \u0B9A\u0BC6\u0BAF\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0B89\u0BA4\u0BB5\u0BC1\u0BAE\u0BCD." : "Completion is decent, but time-blocking your top priorities earlier will help." : isTamil ? "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD board \u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BBE\u0B95 \u0BA8\u0BBF\u0BB0\u0BAE\u0BCD\u0BAA\u0BBF\u0BAF\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BB2\u0BBE\u0BAE\u0BCD. \u0BA4\u0BBF\u0BA9\u0B9A\u0BB0\u0BBF load \u0B95\u0BC1\u0BB1\u0BC8\u0BA4\u0BCD\u0BA4\u0BC1 top 3 tasks-\u0B95\u0BCD\u0B95\u0BC1 exact start time \u0B95\u0BCA\u0B9F\u0BC1\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD." : "Your board may be overfilled. Cut daily load and assign exact start times to the top 3 tasks.",
        trend: trendDelta >= 0 ? isTamil ? `\u0BB5\u0BBE\u0BB0\u0BA4\u0BCD\u0BA4\u0BBF\u0BA9\u0BCD \u0BA4\u0BCA\u0B9F\u0B95\u0BCD\u0B95\u0BAE\u0BCD \u0BAE\u0BC1\u0BA4\u0BB2\u0BCD \u0B9A\u0BC1\u0BAE\u0BBE\u0BB0\u0BCD ${Math.abs(trendDelta)} points \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BC7\u0BB1\u0BCD\u0BB1\u0BAE\u0BCD \u0B95\u0BBE\u0BA3\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1.` : `Trend is improving by about ${Math.abs(trendDelta)} points from the start of the week.` : isTamil ? `\u0BB5\u0BBE\u0BB0\u0BA4\u0BCD\u0BA4\u0BBF\u0BA9\u0BCD \u0BAA\u0BCB\u0BA4\u0BC1 \u0B9A\u0BC1\u0BAE\u0BBE\u0BB0\u0BCD ${Math.abs(trendDelta)} points \u0B95\u0BC1\u0BB1\u0BC8\u0BB5\u0BC1 \u0B8F\u0BB1\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1.` : `Trend dipped by about ${Math.abs(trendDelta)} points during the week.`,
        predictedPct,
        chartPoints: completionTrend,
        nextWeekPlan,
        burnoutRisk,
        overdueCount: overdueTasks.length,
        overloadedDays: overloadedDays.length,
        nextWeekTaskDrafts
      };
    }, [appLanguage, copy.analytics, goals, nowMinutes, streakDays, weekly]);
    const createNextWeekPlan = (0, import_react.useCallback)(() => {
      const draftTasks = aiWeeklyAnalysis.nextWeekTaskDrafts || [];
      if (!draftTasks.length) return;
      const existingSignatures = new Set(
        goals.map((goal) => `${goal.date}|${goal.startTime || ""}|${String(goal.text || "").trim().toLowerCase()}`)
      );
      const freshTasks = draftTasks.filter((goal) => !existingSignatures.has(`${goal.date}|${goal.startTime || ""}|${String(goal.text || "").trim().toLowerCase()}`)).map((goal, index) => (0, import_helpers.normalizeGoal)({ ...goal, id: Date.now() + index }));
      if (!freshTasks.length) {
        window.alert(copy.analytics.planReady);
        return;
      }
      save([...goals, ...freshTasks]);
      setActiveView("planner");
      setWeekBase(/* @__PURE__ */ new Date(`${freshTasks[0].date}T00:00:00`));
      setActiveDate(freshTasks[0].date);
      window.alert(copy.analytics.planCreated);
    }, [aiWeeklyAnalysis.nextWeekTaskDrafts, copy.analytics, goals, save]);
    (0, import_react.useEffect)(() => {
      const onKey = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
          e.preventDefault();
          setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
          setEditingGoal(null);
          setShowForm(true);
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
          e.preventDefault();
          searchRef.current?.focus();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
          e.preventDefault();
          setUiScale((s) => Math.min(130, s + 4));
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "-") {
          e.preventDefault();
          setUiScale((s) => Math.max(80, s - 4));
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "0") {
          e.preventDefault();
          setUiScale(100);
          return;
        }
        if (showForm && e.key === "Escape") {
          e.preventDefault();
          setShowForm(false);
        }
        if (showForm && e.key === "Enter" && !e.shiftKey && document.activeElement?.tagName !== "TEXTAREA") {
          e.preventDefault();
          submitForm();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [showForm, activeDate, form, editingGoal, goals]);
    (0, import_useKeyboardShortcuts.default)([
      { key: "1", ctrl: true, action: () => setActiveView("insights") },
      { key: "2", ctrl: true, action: () => setActiveView("tasks") },
      { key: "3", ctrl: true, action: () => setActiveView("planner") },
      { key: "4", ctrl: true, action: () => setActiveView("settings") },
      { key: "w", ctrl: true, action: () => setPlannerView((prev) => prev === "monthly" ? "weekly" : "monthly") },
      { key: "?", action: () => setShowShortcuts((s) => !s) }
    ]);
    const onTaskTextChange = (0, import_react.useCallback)((value) => {
      setForm((prev) => {
        const next = { ...prev, text: value };
        const cleaned = value.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
        if (cleaned.length === 1) {
          const parsed = (0, import_helpers.parseTaskLine)(cleaned[0], prev);
          if (parsed.matchedRange) {
            next.text = parsed.text;
            next.startTime = parsed.startTime;
            next.endTime = parsed.endTime;
            next.reminder = parsed.reminder;
            next.session = parsed.session;
          }
        }
        return next;
      });
    }, []);
    const submitForm = () => {
      if (!form.text.trim()) return;
      const cleaned = form.text.split(/\r?\n/).map((line) => line.replace(/^\s*[-*]\s*/, "").trim()).filter(Boolean);
      const parsedEntries = cleaned.map((line) => (0, import_helpers.parseTaskLine)(line, form));
      if (parsedEntries.some((entry) => entry.startTime && entry.endTime && (0, import_helpers.hasSameStartEnd)(entry.startTime, entry.endTime))) return window.alert("Start and end time cannot be same.");
      if (editingGoal) {
        const parsed = parsedEntries[0] || (0, import_helpers.parseTaskLine)(cleaned[0] || form.text.trim(), form);
        save(goals.map((g) => g.id === editingGoal ? { ...g, ...form, text: parsed.text || cleaned[0] || form.text.trim(), startTime: parsed.startTime || form.startTime, endTime: parsed.endTime || form.endTime, reminder: parsed.reminder || form.reminder || parsed.startTime || "", session: parsed.session || (parsed.startTime ? "Morning" : form.session) } : g));
      } else if (cleaned.length > 1) {
        save([...goals, ...parsedEntries.map((entry, idx) => (0, import_helpers.normalizeGoal)({ id: Date.now() + idx, ...form, text: entry.text || cleaned[idx], startTime: entry.startTime || form.startTime, endTime: entry.endTime || form.endTime, reminder: entry.reminder || form.reminder || entry.startTime || "", session: entry.session || (entry.startTime ? "Morning" : form.session) }))]);
      } else {
        const parsed = parsedEntries[0] || (0, import_helpers.parseTaskLine)(cleaned[0] || form.text.trim(), form);
        save([...goals, (0, import_helpers.normalizeGoal)({ id: Date.now(), ...form, text: parsed.text || cleaned[0] || form.text.trim(), startTime: parsed.startTime || form.startTime, endTime: parsed.endTime || form.endTime, reminder: parsed.reminder || form.reminder || parsed.startTime || "", session: parsed.session || (parsed.startTime ? "Morning" : form.session) })]);
      }
      (0, import_useMobileFeatures.triggerHaptic)("light");
      setShowForm(false);
    };
    const handleAiAutoSchedule = async () => {
      setAiLoading(true);
      try {
        const API_URL = typeof window !== "undefined" && window.Capacitor ? "https://task-application-sigma.vercel.app/api/gemini" : "/api/gemini";
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: userName || "Friend",
            existingTasks: pendingGoals.slice(0, 5),
            recentTasks: goals.slice(-8),
            date: activeDate,
            language: appLanguage,
            context: aiContext.trim()
          })
        });
        if (!response.ok) throw new Error("API failed");
        const data = await response.json();
        if (data.schedule) {
          onTaskTextChange(data.schedule);
        } else {
          throw new Error(data.error || "No schedule returned");
        }
      } catch (err) {
        console.error("AI schedule error:", err);
        const fallback = (appLanguage === "ta" ? [
          "09:00 - 10:30 - \u0BAE\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BAF \u0BB5\u0BC7\u0BB2\u0BC8 \u0B95\u0BB5\u0BA9 \u0B85\u0BAE\u0BB0\u0BCD\u0BB5\u0BC1",
          "10:30 - 10:45 - \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF \u0B87\u0B9F\u0BC8\u0BB5\u0BC7\u0BB3\u0BC8 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BA8\u0BC0\u0B9F\u0BCD\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1",
          "10:45 - 12:00 - \u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD admin \u0BB5\u0BC7\u0BB2\u0BC8",
          "12:00 - 13:00 - \u0BAE\u0BA4\u0BBF\u0BAF \u0B89\u0BA3\u0BB5\u0BC1 \u0B87\u0B9F\u0BC8\u0BB5\u0BC7\u0BB3\u0BC8",
          "13:00 - 15:00 - \u0B95\u0BC2\u0B9F\u0BCD\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B92\u0BA4\u0BCD\u0BA4\u0BC1\u0BB4\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1",
          "15:00 - 17:00 - \u0BA8\u0BBE\u0BB3\u0BCD \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BBE\u0BAF\u0BCD\u0BB5\u0BC1 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"
        ] : [
          "09:00 - 10:30 - Deep Work and Focus Session",
          "10:30 - 10:45 - Short Break and Stretch",
          "10:45 - 12:00 - Emails and Admin Tasks",
          "12:00 - 13:00 - Lunch Break",
          "13:00 - 15:00 - Meetings and Collaboration",
          "15:00 - 17:00 - Review and Wrap Up"
        ]).join("\n");
        onTaskTextChange(fallback);
        window.alert(appLanguage === "ta" ? "AI \u0B95\u0BBF\u0B9F\u0BC8\u0B95\u0BCD\u0B95\u0BB5\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8. smart default schedule \u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1!" : "AI unavailable - showing smart default schedule instead!");
      } finally {
        setAiLoading(false);
      }
    };
    const handleImportTasks = (0, import_react.useCallback)((importedTasks) => {
      save([...goals, ...importedTasks.map((task) => ({ ...(0, import_helpers.normalizeGoal)(task), id: Date.now() + Math.random() }))]);
    }, [goals, save]);
    const markAllPendingDone = () => {
      const pendingIds = new Set(pendingGoals.map((g) => g.id));
      save(goals.map((g) => {
        if (!pendingIds.has(g.id)) return g;
        if (g.repeat === "None") return { ...g, done: true };
        return { ...g, doneOn: { ...g.doneOn || {}, [activeDate]: true } };
      }));
    };
    const reopenAllCompleted = () => {
      const completedIds = new Set(completedGoals.map((g) => g.id));
      save(goals.map((g) => {
        if (!completedIds.has(g.id)) return g;
        if (g.repeat === "None") return { ...g, done: false };
        const nextDoneOn = { ...g.doneOn || {} };
        delete nextDoneOn[activeDate];
        return { ...g, doneOn: nextDoneOn };
      }));
    };
    const duplicatePendingToTomorrow = () => {
      const d = /* @__PURE__ */ new Date(`${activeDate}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const nextKey = (0, import_helpers.toKey)(d);
      const copies = pendingGoals.map((g, idx) => (0, import_helpers.normalizeGoal)({ ...g, id: Date.now() + idx, date: nextKey, done: false, doneOn: {}, repeat: "None" }));
      if (copies.length) save([...goals, ...copies]);
    };
    const handleApplyTemplate = (0, import_react.useCallback)((tasks) => {
      const today = (0, import_helpers.todayKey)();
      const newGoals = tasks.map((line, idx) => {
        const parsed = (0, import_helpers.parseTaskLine)(line, { date: today });
        return (0, import_helpers.normalizeGoal)({
          id: Date.now() + Math.random() + idx,
          text: parsed.text,
          date: today,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          reminder: parsed.reminder || parsed.startTime || "",
          session: parsed.session,
          priority: "Medium",
          doneOn: {}
        });
      });
      save([...goals, ...newGoals]);
      (0, import_useMobileFeatures.triggerHaptic)("success");
    }, [goals, save]);
    const clearAppCache = (0, import_react.useCallback)(async () => {
      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        window.alert("App cache cleared successfully.");
      } catch {
        window.alert("Unable to clear cache on this device.");
      }
    }, []);
    const openAndroidBatterySettings = (0, import_react.useCallback)(async () => {
      try {
        if (import_deviceSettings.DeviceSettings?.openBatteryOptimizationSettings) {
          await import_deviceSettings.DeviceSettings.openBatteryOptimizationSettings();
          return;
        }
        window.alert("Battery optimization settings shortcut is available in Android build.");
      } catch {
        window.alert("Unable to open battery optimization settings on this device.");
      }
    }, []);
    const openAndroidAppSettings = (0, import_react.useCallback)(async () => {
      try {
        if (import_deviceSettings.DeviceSettings?.openAppSettings) {
          await import_deviceSettings.DeviceSettings.openAppSettings();
          return;
        }
        window.alert("App settings shortcut is available in Android build.");
      } catch {
        window.alert("Unable to open app settings on this device.");
      }
    }, []);
    const clearLocalAppData = (0, import_react.useCallback)(async () => {
      await Promise.all([
        (0, import_helpers.writeStorage)("[]"),
        (0, import_helpers.writePrefs)({}),
        (0, import_helpers.writeUiState)({}),
        (0, import_helpers.writePersist)(import_constants.TOOLS_KEY, JSON.stringify({})),
        (0, import_helpers.writePersist)(import_constants.CAREER_KEY, JSON.stringify({})),
        (0, import_helpers.writePersist)(import_constants.JOURNAL_KEY, "{}"),
        (0, import_helpers.writePersist)(import_constants.HABITS_KEY, "[]"),
        (0, import_helpers.writePersist)(import_constants.GOALS_KEY, "[]")
      ]);
      localStorage.removeItem("taskPlanner_userName");
      setGoals([]);
      setJournalEntries({});
      setHabitsData([]);
      setGoalsData([]);
      setSelectedGoalIds([]);
      setSearchTerm("");
      setPriorityFilter("All");
      setTimeFilter("All Times");
      setThemeMode("dark");
      setAutoThemeMode("off");
      setAppLanguage("en");
      setTaskFontSize(18);
      setTaskFontFamily(import_constants.FONT_OPTIONS[0].value);
      setUiScale(96);
      setOverdueEnabled(true);
      setFontWeight(500);
      setSoundTheme("default");
      setHapticEnabled(true);
      setLiveHighlightEnabled(true);
      setUserName("");
      setAiContext("");
      setShowNameSetup(true);
    }, []);
    const generateMonthlyReport = (0, import_react.useCallback)(() => {
      const now = /* @__PURE__ */ new Date();
      const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      const reportWindow = window.open("", "_blank", "width=800,height=600");
      if (!reportWindow) return;
      let totalTasks = 0, totalDone = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = (0, import_helpers.toKey)(d);
        const vis = goals.filter((g) => g.date === key || g.repeat !== "None" && g.date <= key);
        totalTasks += vis.length;
        totalDone += vis.filter((g) => g.doneOn?.[key]).length;
      }
      const overallPct = totalTasks > 0 ? Math.round(totalDone / totalTasks * 100) : 0;
      reportWindow.document.write(`
      <html><head><title>Monthly Report</title>
      <style>body{font-family:system-ui;padding:40px;max-width:700px;margin:0 auto;color:#1a1a2e} h1{color:#2563eb} .stat{display:inline-block;padding:12px 24px;margin:6px;border-radius:10px;background:#f0f4ff;text-align:center} .stat .num{font-size:2rem;font-weight:900;color:#2563eb} .bar-fill{height:12px;border-radius:999px;background:linear-gradient(90deg,#2563eb,#6366f1)}</style>
      </head><body><h1>\u{1F4CA} Monthly Report</h1><div class="stat"><div class="num">${totalDone}</div><div class="lbl">Done</div></div><div class="stat"><div class="num">${totalTasks}</div><div class="lbl">Total</div></div>
      <script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
    }, [goals, streakDays]);
    const themeClass = `theme-${themeMode}`;
    const isPlannerIframeView = activeView === "tasks";
    function buildNextWeekDates() {
      const today = /* @__PURE__ */ new Date();
      const start = new Date(today);
      const currentDay = start.getDay() || 7;
      start.setDate(start.getDate() + (8 - currentDay));
      start.setHours(0, 0, 0, 0);
      return Array.from({ length: 5 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return (0, import_helpers.toKey)(date);
      });
    }
    function shiftTime(time, minutes) {
      if (!time) return "";
      const [hours, mins] = String(time).split(":").map(Number);
      if (Number.isNaN(hours) || Number.isNaN(mins)) return "";
      const date = /* @__PURE__ */ new Date();
      date.setHours(hours, mins + minutes, 0, 0);
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    const activeDateLabel = activeDate === (0, import_helpers.todayKey)() ? copy.common.todayFocus : (/* @__PURE__ */ new Date(`${activeDate}T00:00:00`)).toLocaleDateString(appLanguage === "ta" ? "ta-IN" : "en-IN", { weekday: "long", month: "long", day: "numeric" });
    const mainTabItems = [
      { id: "insights", label: "Dashboard", icon: "\u{1F3E0}" },
      { id: "tasks", label: "Tasks", icon: "\u2705" },
      { id: "planner", label: "Planner", icon: "\u{1F4C5}" },
      { id: "analytics", label: "Analytics", icon: "\u{1F4CA}" },
      { id: "settings", label: "Settings", icon: "\u2699\uFE0F" }
    ];
    const moreTabItems = [
      { id: "career", label: "Career", icon: "\u{1F680}" },
      { id: "tools", label: "Tools", icon: "\u{1F6E0}" },
      { id: "habits", label: "Habits", icon: "\u{1F501}" },
      { id: "journal", label: "Journal", icon: "\u{1F4D3}" },
      { id: "goals", label: "Goals", icon: "\u{1F3AF}" }
    ];
    const tabItems = [...mainTabItems.map((t) => ({ ...t, icon: t.id === "insights" ? "\u{1F4CA}" : t.id === "analytics" ? "\u{1F4C8}" : t.icon })), ...moreTabItems];
    const localizedMainTabItems = mainTabItems.map((tab) => ({ ...tab, label: copy.tabs[tab.id] || tab.label }));
    const localizedMoreTabItems = moreTabItems.map((tab) => ({ ...tab, label: copy.tabs[tab.id] || tab.label }));
    const localizedTabItems = [...localizedMainTabItems, ...localizedMoreTabItems];
    return /* @__PURE__ */ React.createElement("div", { className: `page ${themeClass}${isPlannerIframeView ? " planner-mode" : ""}`, style: { "--task-font-size": `${taskFontSize}px`, "--task-font-family": taskFontFamily, "--ui-scale": `${uiScale / 100}`, "--global-font-weight": fontWeight }, onTouchStart: handleGlobalTouchStart, onTouchEnd: handleGlobalTouchEnd }, /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("div", { className: "tab-nav" }, localizedTabItems.map((tab) => /* @__PURE__ */ React.createElement("button", { key: tab.id, className: `tab-btn ${activeView === tab.id ? "active" : ""}`, onClick: () => setActiveView(tab.id) }, /* @__PURE__ */ React.createElement("span", { className: "tab-icon" }, tab.icon), /* @__PURE__ */ React.createElement("span", { className: "tab-label" }, tab.label)))), showNameSetup && /* @__PURE__ */ React.createElement("div", { className: "overlay", style: { zIndex: 99999, backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.7)" } }, /* @__PURE__ */ React.createElement("div", { className: "modal", style: {
      textAlign: "center",
      padding: "30px 20px",
      background: "var(--card)",
      border: "1px solid rgba(99, 102, 241, 0.4)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      transform: "scale(1)",
      transition: "all 0.3s ease-out"
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: "3.5rem", marginBottom: "10px", animation: "pulse 2s infinite" } }, "\u{1F44B}"), /* @__PURE__ */ React.createElement("h2", { style: { margin: "0 0 10px 0", color: "var(--text)", fontSize: "1.5rem", fontWeight: "800" } }, "Welcome to Task Planner!"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--muted)", fontSize: "0.95rem", marginBottom: "24px", lineHeight: "1.4" } }, "Let's make today productive. ", /* @__PURE__ */ React.createElement("br", null), "What should I call you?"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: "Enter your name...",
        value: tempName,
        onChange: (e) => setTempName(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") handleSaveName();
        },
        autoFocus: true,
        style: {
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "2px solid rgba(99, 102, 241, 0.3)",
          background: "var(--chip)",
          color: "var(--text)",
          fontSize: "1.1rem",
          marginBottom: "20px",
          textAlign: "center",
          outline: "none",
          boxSizing: "border-box"
        }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleSaveName,
        disabled: !tempName.trim(),
        style: {
          width: "100%",
          padding: "14px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          borderRadius: "10px",
          color: "#fff",
          border: "none",
          cursor: tempName.trim() ? "pointer" : "not-allowed",
          background: tempName.trim() ? "linear-gradient(135deg, #a855f7, #6366f1)" : "#475569",
          opacity: tempName.trim() ? 1 : 0.5,
          transition: "all 0.2s"
        }
      },
      "Start Planning \u{1F680}"
    ))), showForm && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setShowForm(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxHeight: "90vh", overflowY: "auto" } }, /* @__PURE__ */ React.createElement("div", { className: "m-title" }, editingGoal ? copy.taskForm.editTask : copy.taskForm.newTask), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.taskDescription), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "fi task-box",
        placeholder: copy.taskForm.taskPlaceholder,
        value: form.text,
        onChange: (e) => onTaskTextChange(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "form-hint" }, '\u{1F4A1} Type "meeting 9am-10am" to auto-fill time fields')), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.aiContext), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        className: "fi task-box",
        placeholder: copy.taskForm.aiContextPlaceholder,
        value: aiContext,
        onChange: (e) => setAiContext(e.target.value),
        style: { minHeight: "78px" }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.date), /* @__PURE__ */ React.createElement("input", { type: "date", className: "fi", value: form.date, onChange: (e) => setForm((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.startTime), /* @__PURE__ */ React.createElement("input", { type: "time", className: "fi", value: form.startTime, onChange: (e) => setForm((p) => ({ ...p, startTime: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.endTime), /* @__PURE__ */ React.createElement("input", { type: "time", className: "fi", value: form.endTime, onChange: (e) => setForm((p) => ({ ...p, endTime: e.target.value })) }))), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.reminderTime), /* @__PURE__ */ React.createElement("input", { type: "time", className: "fi", value: form.reminder, onChange: (e) => setForm((p) => ({ ...p, reminder: e.target.value })) })), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.priority), /* @__PURE__ */ React.createElement("select", { className: "fs", value: form.priority, onChange: (e) => setForm((p) => ({ ...p, priority: e.target.value })) }, import_constants.PRIORITY_OPTIONS.map((p) => /* @__PURE__ */ React.createElement("option", { key: p, value: p }, p)))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.session), /* @__PURE__ */ React.createElement("select", { className: "fs", value: form.session, onChange: (e) => setForm((p) => ({ ...p, session: e.target.value })) }, import_constants.SESSION_OPTIONS.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, s)))), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("label", { className: "fl" }, copy.taskForm.repeat), /* @__PURE__ */ React.createElement("select", { className: "fs", value: form.repeat, onChange: (e) => setForm((p) => ({ ...p, repeat: e.target.value })) }, import_constants.REPEAT_OPTIONS.map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "10px", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("button", { className: "new-btn", style: { flex: 2 }, onClick: submitForm }, editingGoal ? copy.common.saveChanges : copy.common.addTask), /* @__PURE__ */ React.createElement("button", { className: "hero-btn", style: { flex: 1 }, onClick: () => setShowForm(false) }, copy.common.cancel)), !editingGoal && /* @__PURE__ */ React.createElement("button", { className: "tool-btn", style: { width: "100%", marginTop: "10px", opacity: aiLoading ? 0.7 : 1 }, onClick: handleAiAutoSchedule, disabled: aiLoading }, aiLoading ? copy.taskForm.aiThinking : copy.taskForm.aiAutoSchedule))), liveTaskPopup && /* @__PURE__ */ React.createElement(import_SharedUI.LiveTaskPopup, { task: liveTaskPopup, onClose: () => setLiveTaskPopup(null) }), upcomingTaskAlert && /* @__PURE__ */ React.createElement("div", { className: "toast-notification" }, /* @__PURE__ */ React.createElement("div", { className: "toast-accent-bar" }), /* @__PURE__ */ React.createElement("div", { className: "toast-body" }, /* @__PURE__ */ React.createElement("div", { className: "toast-icon-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "toast-icon" }, "\u23F0")), /* @__PURE__ */ React.createElement("div", { className: "toast-content" }, /* @__PURE__ */ React.createElement("div", { className: "toast-title" }, copy.alerts.nextTaskSoon), /* @__PURE__ */ React.createElement("div", { className: "toast-message" }, '"', upcomingTaskAlert.text, '" at ', upcomingTaskAlert.startTime)), /* @__PURE__ */ React.createElement("button", { className: "toast-close", onClick: () => setUpUpcomingTaskAlert(null) }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "toast-progress-bar" }, /* @__PURE__ */ React.createElement("div", { className: "toast-progress-fill" }))), reminderPopup && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setReminderPopup(null) }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "m-title" }, copy.alerts.taskReminder), /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("div", { className: "fl" }, copy.common.task), /* @__PURE__ */ React.createElement("div", { className: "fi" }, reminderPopup.text)), (reminderPopup.startTime || reminderPopup.endTime) && /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("div", { className: "fl" }, copy.common.time), /* @__PURE__ */ React.createElement("div", { className: "fi" }, (0, import_helpers.formatTimeRange)(reminderPopup.startTime, reminderPopup.endTime))), reminderPopup.session && /* @__PURE__ */ React.createElement("div", { className: "fg" }, /* @__PURE__ */ React.createElement("div", { className: "fl" }, copy.common.session), /* @__PURE__ */ React.createElement("div", { className: "fi" }, reminderPopup.session)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("button", { className: "new-btn", onClick: () => setReminderPopup(null) }, copy.common.gotIt)))), /* @__PURE__ */ React.createElement(import_react.Suspense, { fallback: /* @__PURE__ */ React.createElement("div", { style: { display: "grid", placeItems: "center", padding: "40px" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 24, height: 24, borderRadius: "50%", border: "3px solid #94a3b8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" } })) }, tabSwitching && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", placeItems: "center", padding: "18px", opacity: 0.8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 14, borderRadius: "50%", border: "2px solid #94a3b8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" } }), " Switching\u2026")), activeView === "insights" && /* @__PURE__ */ React.createElement("div", { key: "insights", className: "view-transition" }, /* @__PURE__ */ React.createElement(DashboardView, { userName, quote, setActiveView, done, total, pct, weekly, streakDays, dueSoon, goals, journalEntries, generateMonthlyReport })), activeView === "tasks" && /* @__PURE__ */ React.createElement("div", { key: "tasks", className: "view-transition" }, /* @__PURE__ */ React.createElement(
      TasksView,
      {
        activeDate,
        setActiveDate,
        activeDateLabel,
        weekBase,
        setWeekBase,
        weekDays,
        liveClockLabel,
        done,
        total,
        pct,
        nextUpcomingGoal,
        setForm,
        setEditingGoal,
        setShowForm,
        liveCurrentGoal,
        liveCountdown,
        focusMode,
        setFocusMode,
        showCelebration,
        setShowCelebration,
        liveHighlightEnabled,
        aiBriefing,
        copy,
        openAiPlanner: () => {
          setForm({ text: "", date: activeDate, reminder: "", startTime: "", endTime: "", repeat: "None", session: "Morning", priority: "Medium" });
          setEditingGoal(null);
          setAiContext("");
          setShowForm(true);
        },
        goals,
        dotsFor,
        priorityFilter,
        setPriorityFilter,
        timeFilter,
        setTimeFilter,
        searchTerm,
        setSearchTerm,
        searchRef,
        pendingGoals,
        completedGoals,
        visibleGoals,
        selectedGoalIds,
        selectedSet,
        selectAllVisibleGoals,
        deleteSelectedGoals,
        clearSelectedGoals,
        completedPulseId,
        celebratingGoalId,
        toggleDoneWithCelebration,
        removeGoal,
        toggleSelectGoal,
        markAllPendingDone,
        duplicatePendingToTomorrow,
        reopenAllCompleted
      }
    )), activeView === "planner" && /* @__PURE__ */ React.createElement("div", { key: "planner", className: "view-transition" }, /* @__PURE__ */ React.createElement(PlannerView, { plannerView, setPlannerView, goals, setActiveDate, setActiveView })), activeView === "analytics" && /* @__PURE__ */ React.createElement("div", { key: "analytics", className: "view-transition" }, /* @__PURE__ */ React.createElement(AnalyticsView, { setShowPomodoro, setShowImportExport, setActiveView, goals, weekly, aiWeeklyAnalysis, onCreateNextWeekPlan: createNextWeekPlan, appLanguage, copy })), activeView === "career" && /* @__PURE__ */ React.createElement("div", { key: "career", className: "view-transition" }, /* @__PURE__ */ React.createElement(CareerView, null)), activeView === "tools" && /* @__PURE__ */ React.createElement("div", { key: "tools", className: "view-transition" }, /* @__PURE__ */ React.createElement(ToolsView, { onOpenPomodoro: () => setShowPomodoro(true), appLanguage, copy }), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 16px 20px", maxWidth: "600px", margin: "0 auto" } }, /* @__PURE__ */ React.createElement(import_TaskTemplates.default, { onApplyTemplate: handleApplyTemplate }))), activeView === "settings" && /* @__PURE__ */ React.createElement("div", { key: "settings", className: "view-transition" }, /* @__PURE__ */ React.createElement(
      SettingsView,
      {
        setActiveView,
        themeMode,
        setThemeMode,
        taskFontFamily,
        setTaskFontFamily,
        taskFontSize,
        setTaskFontSize,
        uiScale,
        setUiScale,
        overdueEnabled,
        setOverdueEnabled,
        fontWeight,
        setFontWeight,
        soundTheme,
        setSoundTheme,
        hapticEnabled,
        setHapticEnabled,
        autoThemeMode,
        setAutoThemeMode,
        liveHighlightEnabled,
        setLiveHighlightEnabled,
        appLanguage,
        setAppLanguage,
        copy,
        userName,
        setUserName,
        notifPerm,
        requestNotifPerm: () => (0, import_notifications.requestNotificationPermission)().then(setNotifPerm),
        goals,
        onReplaceGoals: save,
        onClearCache: clearAppCache,
        onClearLocalData: clearLocalAppData,
        onRefreshNotifications: () => (0, import_notifications.scheduleTaskNotifications)(goals),
        onOpenBatterySettings: openAndroidBatterySettings,
        onOpenAppSettings: openAndroidAppSettings
      }
    )), activeView === "habits" && /* @__PURE__ */ React.createElement("div", { key: "habits", className: "view-transition" }, /* @__PURE__ */ React.createElement(HabitsView, null)), activeView === "journal" && /* @__PURE__ */ React.createElement("div", { key: "journal", className: "view-transition" }, /* @__PURE__ */ React.createElement(JournalView, null)), activeView === "goals" && /* @__PURE__ */ React.createElement("div", { key: "goals", className: "view-transition" }, /* @__PURE__ */ React.createElement(GoalsView, null))), showPomodoro && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setShowPomodoro(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 400 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "m-title", style: { margin: 0 } }, "\u{1F345} Pomodoro Timer"), /* @__PURE__ */ React.createElement("button", { className: "mini-btn", onClick: () => setShowPomodoro(false) }, "\u2715 Close")), /* @__PURE__ */ React.createElement(
      import_PomodoroTimer.default,
      {
        onTaskComplete: () => (0, import_notifications.showAppNotification)("Pomodoro Complete! \u{1F389}", { body: "Take a 5-minute break!" }),
        onBreakComplete: () => (0, import_notifications.showAppNotification)("Break Over!", { body: "Time to focus again!" })
      }
    ))), showImportExport && /* @__PURE__ */ React.createElement("div", { className: "overlay", onClick: () => setShowImportExport(false) }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 500 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { className: "m-title", style: { margin: 0 } }, "\u{1F4E6} Import / Export Tasks"), /* @__PURE__ */ React.createElement("button", { className: "mini-btn", onClick: () => setShowImportExport(false) }, "\u2715 Close")), /* @__PURE__ */ React.createElement(
      import_TaskImportExport.default,
      {
        goals,
        onImport: (imported) => {
          const merged = [...goals, ...imported.filter((t) => !goals.find((g) => g.id === t.id))];
          save(merged);
          setShowImportExport(false);
          window.alert(`\u2705 ${imported.length} tasks imported!`);
        }
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "mobile-bottom-nav" }, localizedMainTabItems.map((tab) => /* @__PURE__ */ React.createElement("button", { key: tab.id, className: `mobile-nav-btn ${activeView === tab.id ? "active" : ""}`, onClick: () => {
      if (typeof import_useMobileFeatures.triggerHaptic === "function") (0, import_useMobileFeatures.triggerHaptic)("light");
      setActiveView(tab.id);
      setShowMoreMenu(false);
    } }, /* @__PURE__ */ React.createElement("span", { className: "mobile-nav-icon" }, tab.icon), /* @__PURE__ */ React.createElement("span", { className: "mobile-nav-label" }, tab.label))), /* @__PURE__ */ React.createElement("button", { className: `mobile-nav-btn ${showMoreMenu ? "active" : ""}`, onClick: () => {
      if (typeof import_useMobileFeatures.triggerHaptic === "function") (0, import_useMobileFeatures.triggerHaptic)("light");
      setShowMoreMenu(!showMoreMenu);
    } }, /* @__PURE__ */ React.createElement("span", { className: "mobile-nav-icon" }, "\u22EF"), /* @__PURE__ */ React.createElement("span", { className: "mobile-nav-label" }, copy.tabs.more))), showMoreMenu && /* @__PURE__ */ React.createElement("div", { className: "more-menu-overlay", onClick: () => setShowMoreMenu(false) }, /* @__PURE__ */ React.createElement("div", { className: "more-menu", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "more-menu-header" }, /* @__PURE__ */ React.createElement("h3", null, copy.tabs.more), /* @__PURE__ */ React.createElement("button", { className: "more-menu-close", onClick: () => setShowMoreMenu(false) }, "\u2715")), /* @__PURE__ */ React.createElement("div", { className: "more-menu-items" }, localizedMoreTabItems.map((tab) => /* @__PURE__ */ React.createElement("button", { key: tab.id, className: `more-menu-item ${activeView === tab.id ? "active" : ""}`, onClick: () => {
      setActiveView(tab.id);
      setShowMoreMenu(false);
    } }, /* @__PURE__ */ React.createElement("span", { className: "more-menu-icon" }, tab.icon), /* @__PURE__ */ React.createElement("span", { className: "more-menu-label" }, tab.label))))))));
  }
  var App_default = App2;
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
