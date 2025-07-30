/*! For license information please see vendors-d96105ec.718208b7a01d0d34998b.js.LICENSE.txt */
(self.webpackChunkvenezia_frontend=self.webpackChunkvenezia_frontend||[]).push([[4078],{45588:function(e,t,n){"use strict";function r(){return r=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},r.apply(this,arguments)}var a;n.d(t,{AO:function(){return d},B6:function(){return O},Gh:function(){return R},HS:function(){return D},Oi:function(){return s},Rr:function(){return p},pX:function(){return M},pb:function(){return I},rc:function(){return a},tH:function(){return C},ue:function(){return h},yD:function(){return A},zR:function(){return i}}),function(e){e.Pop="POP",e.Push="PUSH",e.Replace="REPLACE"}(a||(a={}));const o="popstate";function i(e){return void 0===e&&(e={}),function(e,t,n,i){void 0===i&&(i={});let{window:l=document.defaultView,v5Compat:p=!1}=i,f=l.history,h=a.Pop,m=null,g=y();function y(){return(f.state||{idx:null}).idx}function v(){h=a.Pop;let e=y(),t=null==e?null:e-g;g=e,m&&m({action:h,location:b.location,delta:t})}function w(e){let t="null"!==l.location.origin?l.location.origin:l.location.href,n="string"==typeof e?e:d(e);return n=n.replace(/ $/,"%20"),s(t,"No window.location.(origin|href) available to create URL for href: "+n),new URL(n,t)}null==g&&(g=0,f.replaceState(r({},f.state,{idx:g}),""));let b={get action(){return h},get location(){return e(l,f)},listen(e){if(m)throw new Error("A history only accepts one active listener");return l.addEventListener(o,v),m=e,()=>{l.removeEventListener(o,v),m=null}},createHref(e){return t(l,e)},createURL:w,encodeLocation(e){let t=w(e);return{pathname:t.pathname,search:t.search,hash:t.hash}},push:function(e,t){h=a.Push;let r=u(b.location,e,t);n&&n(r,e),g=y()+1;let o=c(r,g),i=b.createHref(r);try{f.pushState(o,"",i)}catch(e){if(e instanceof DOMException&&"DataCloneError"===e.name)throw e;l.location.assign(i)}p&&m&&m({action:h,location:b.location,delta:1})},replace:function(e,t){h=a.Replace;let r=u(b.location,e,t);n&&n(r,e),g=y();let o=c(r,g),i=b.createHref(r);f.replaceState(o,"",i),p&&m&&m({action:h,location:b.location,delta:0})},go(e){return f.go(e)}};return b}((function(e,t){let{pathname:n,search:r,hash:a}=e.location;return u("",{pathname:n,search:r,hash:a},t.state&&t.state.usr||null,t.state&&t.state.key||"default")}),(function(e,t){return"string"==typeof t?t:d(t)}),null,e)}function s(e,t){if(!1===e||null==e)throw new Error(t)}function l(e,t){if(!e){"undefined"!=typeof console&&console.warn(t);try{throw new Error(t)}catch(e){}}}function c(e,t){return{usr:e.state,key:e.key,idx:t}}function u(e,t,n,a){return void 0===n&&(n=null),r({pathname:"string"==typeof e?e:e.pathname,search:"",hash:""},"string"==typeof t?p(t):t,{state:n,key:t&&t.key||a||Math.random().toString(36).substr(2,8)})}function d(e){let{pathname:t="/",search:n="",hash:r=""}=e;return n&&"?"!==n&&(t+="?"===n.charAt(0)?n:"?"+n),r&&"#"!==r&&(t+="#"===r.charAt(0)?r:"#"+r),t}function p(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substr(n),e=e.substr(0,n));let r=e.indexOf("?");r>=0&&(t.search=e.substr(r),e=e.substr(0,r)),e&&(t.pathname=e)}return t}var f;function h(e,t,n){return void 0===n&&(n="/"),function(e,t,n,r){let a=I(("string"==typeof t?p(t):t).pathname||"/",n);if(null==a)return null;let o=m(e);!function(e){e.sort(((e,t)=>e.score!==t.score?t.score-e.score:function(e,t){return e.length===t.length&&e.slice(0,-1).every(((e,n)=>e===t[n]))?e[e.length-1]-t[t.length-1]:0}(e.routesMeta.map((e=>e.childrenIndex)),t.routesMeta.map((e=>e.childrenIndex)))))}(o);let i=null;for(let e=0;null==i&&e<o.length;++e){let t=S(a);i=P(o[e],t,r)}return i}(e,t,n,!1)}function m(e,t,n,r){void 0===t&&(t=[]),void 0===n&&(n=[]),void 0===r&&(r="");let a=(e,a,o)=>{let i={relativePath:void 0===o?e.path||"":o,caseSensitive:!0===e.caseSensitive,childrenIndex:a,route:e};i.relativePath.startsWith("/")&&(s(i.relativePath.startsWith(r),'Absolute route path "'+i.relativePath+'" nested under path "'+r+'" is not valid. An absolute child route path must start with the combined path of all its parent routes.'),i.relativePath=i.relativePath.slice(r.length));let l=D([r,i.relativePath]),c=n.concat(i);e.children&&e.children.length>0&&(s(!0!==e.index,'Index routes must not have child routes. Please remove all child routes from route path "'+l+'".'),m(e.children,t,c,l)),(null!=e.path||e.index)&&t.push({path:l,score:$(l,e.index),routesMeta:c})};return e.forEach(((e,t)=>{var n;if(""!==e.path&&null!=(n=e.path)&&n.includes("?"))for(let n of g(e.path))a(e,t,n);else a(e,t)})),t}function g(e){let t=e.split("/");if(0===t.length)return[];let[n,...r]=t,a=n.endsWith("?"),o=n.replace(/\?$/,"");if(0===r.length)return a?[o,""]:[o];let i=g(r.join("/")),s=[];return s.push(...i.map((e=>""===e?o:[o,e].join("/")))),a&&s.push(...i),s.map((t=>e.startsWith("/")&&""===t?"/":t))}!function(e){e.data="data",e.deferred="deferred",e.redirect="redirect",e.error="error"}(f||(f={})),new Set(["lazy","caseSensitive","path","id","index","children"]);const y=/^:[\w-]+$/,v=3,w=2,b=1,x=10,E=-2,k=e=>"*"===e;function $(e,t){let n=e.split("/"),r=n.length;return n.some(k)&&(r+=E),t&&(r+=w),n.filter((e=>!k(e))).reduce(((e,t)=>e+(y.test(t)?v:""===t?b:x)),r)}function P(e,t,n){void 0===n&&(n=!1);let{routesMeta:r}=e,a={},o="/",i=[];for(let e=0;e<r.length;++e){let s=r[e],l=e===r.length-1,c="/"===o?t:t.slice(o.length)||"/",u=O({path:s.relativePath,caseSensitive:s.caseSensitive,end:l},c),d=s.route;if(!u&&l&&n&&!r[r.length-1].route.index&&(u=O({path:s.relativePath,caseSensitive:s.caseSensitive,end:!1},c)),!u)return null;Object.assign(a,u.params),i.push({params:a,pathname:D([o,u.pathname]),pathnameBase:H(D([o,u.pathnameBase])),route:d}),"/"!==u.pathnameBase&&(o=D([o,u.pathnameBase]))}return i}function O(e,t){"string"==typeof e&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=function(e,t,n){void 0===t&&(t=!1),void 0===n&&(n=!0),l("*"===e||!e.endsWith("*")||e.endsWith("/*"),'Route path "'+e+'" will be treated as if it were "'+e.replace(/\*$/,"/*")+'" because the `*` character must always follow a `/` in the pattern. To get rid of this warning, please change the route path to "'+e.replace(/\*$/,"/*")+'".');let r=[],a="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,((e,t,n)=>(r.push({paramName:t,isOptional:null!=n}),n?"/?([^\\/]+)?":"/([^\\/]+)")));return e.endsWith("*")?(r.push({paramName:"*"}),a+="*"===e||"/*"===e?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?a+="\\/*$":""!==e&&"/"!==e&&(a+="(?:(?=\\/|$))"),[new RegExp(a,t?void 0:"i"),r]}(e.path,e.caseSensitive,e.end),a=t.match(n);if(!a)return null;let o=a[0],i=o.replace(/(.)\/+$/,"$1"),s=a.slice(1);return{params:r.reduce(((e,t,n)=>{let{paramName:r,isOptional:a}=t;if("*"===r){let e=s[n]||"";i=o.slice(0,o.length-e.length).replace(/(.)\/+$/,"$1")}const l=s[n];return e[r]=a&&!l?void 0:(l||"").replace(/%2F/g,"/"),e}),{}),pathname:o,pathnameBase:i,pattern:e}}function S(e){try{return e.split("/").map((e=>decodeURIComponent(e).replace(/\//g,"%2F"))).join("/")}catch(t){return l(!1,'The URL path "'+e+'" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent encoding ('+t+")."),e}}function I(e,t){if("/"===t)return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,r=e.charAt(n);return r&&"/"!==r?null:e.slice(n)||"/"}function j(e,t,n,r){return"Cannot include a '"+e+"' character in a manually specified `to."+t+"` field ["+JSON.stringify(r)+"].  Please separate it out to the `to."+n+'` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.'}function A(e,t){let n=function(e){return e.filter(((e,t)=>0===t||e.route.path&&e.route.path.length>0))}(e);return t?n.map(((e,t)=>t===n.length-1?e.pathname:e.pathnameBase)):n.map((e=>e.pathnameBase))}function R(e,t,n,a){let o;void 0===a&&(a=!1),"string"==typeof e?o=p(e):(o=r({},e),s(!o.pathname||!o.pathname.includes("?"),j("?","pathname","search",o)),s(!o.pathname||!o.pathname.includes("#"),j("#","pathname","hash",o)),s(!o.search||!o.search.includes("#"),j("#","search","hash",o)));let i,l=""===e||""===o.pathname,c=l?"/":o.pathname;if(null==c)i=n;else{let e=t.length-1;if(!a&&c.startsWith("..")){let t=c.split("/");for(;".."===t[0];)t.shift(),e-=1;o.pathname=t.join("/")}i=e>=0?t[e]:"/"}let u=function(e,t){void 0===t&&(t="/");let{pathname:n,search:r="",hash:a=""}="string"==typeof e?p(e):e,o=n?n.startsWith("/")?n:function(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach((e=>{".."===e?n.length>1&&n.pop():"."!==e&&n.push(e)})),n.length>1?n.join("/"):"/"}(n,t):t;return{pathname:o,search:N(r),hash:T(a)}}(o,i),d=c&&"/"!==c&&c.endsWith("/"),f=(l||"."===c)&&n.endsWith("/");return u.pathname.endsWith("/")||!d&&!f||(u.pathname+="/"),u}const D=e=>e.join("/").replace(/\/\/+/g,"/"),H=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),N=e=>e&&"?"!==e?e.startsWith("?")?e:"?"+e:"",T=e=>e&&"#"!==e?e.startsWith("#")?e:"#"+e:"";class C extends Error{}function M(e){return null!=e&&"number"==typeof e.status&&"string"==typeof e.statusText&&"boolean"==typeof e.internal&&"data"in e}const W=["post","put","patch","delete"],z=(new Set(W),["get",...W]);new Set(z),new Set([301,302,303,307,308]),new Set([307,308]),Symbol("deferred")},60799:function(e,t,n){"use strict";n.d(t,{Ay:function(){return L},l$:function(){return z}});var r=n(96540),a=n(21724),o=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,i=(()=>{let e=0;return()=>(++e).toString()})(),s=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),l=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map((e=>e.id===t.toast.id?{...e,...t.toast}:e))};case 2:let{toast:n}=t;return l(e,{type:e.toasts.find((e=>e.id===n.id))?1:0,toast:n});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map((e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e))};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter((e=>e.id!==t.toastId))};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map((e=>({...e,pauseDuration:e.pauseDuration+a})))}}},c=[],u={toasts:[],pausedAt:void 0},d=e=>{u=l(u,e),c.forEach((e=>{e(u)}))},p={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},f=e=>(t,n)=>{let r=((e,t="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(null==n?void 0:n.id)||i()}))(t,e,n);return d({type:2,toast:r}),r.id},h=(e,t)=>f("blank")(e,t);h.error=f("error"),h.success=f("success"),h.loading=f("loading"),h.custom=f("custom"),h.dismiss=e=>{d({type:3,toastId:e})},h.remove=e=>d({type:4,toastId:e}),h.promise=(e,t,n)=>{let r=h.loading(t.loading,{...n,...null==n?void 0:n.loading});return"function"==typeof e&&(e=e()),e.then((e=>{let a=t.success?o(t.success,e):void 0;return a?h.success(a,{id:r,...n,...null==n?void 0:n.success}):h.dismiss(r),e})).catch((e=>{let a=t.error?o(t.error,e):void 0;a?h.error(a,{id:r,...n,...null==n?void 0:n.error}):h.dismiss(r)})),e};var m=(e,t)=>{d({type:1,toast:{id:e,height:t}})},g=()=>{d({type:5,time:Date.now()})},y=new Map,v=a.i7`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,w=a.i7`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,b=a.i7`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,x=(0,a.I4)("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${v} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${w} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${b} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,E=a.i7`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,k=(0,a.I4)("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${E} 1s linear infinite;
`,$=a.i7`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,P=a.i7`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,O=(0,a.I4)("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${$} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${P} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,S=(0,a.I4)("div")`
  position: absolute;
`,I=(0,a.I4)("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,j=a.i7`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,A=(0,a.I4)("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${j} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,R=({toast:e})=>{let{icon:t,type:n,iconTheme:a}=e;return void 0!==t?"string"==typeof t?r.createElement(A,null,t):t:"blank"===n?null:r.createElement(I,null,r.createElement(k,{...a}),"loading"!==n&&r.createElement(S,null,"error"===n?r.createElement(x,{...a}):r.createElement(O,{...a})))},D=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,H=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,N=(0,a.I4)("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,T=(0,a.I4)("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,C=r.memo((({toast:e,position:t,style:n,children:i})=>{let l=e.height?((e,t)=>{let n=e.includes("top")?1:-1,[r,o]=s()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[D(n),H(n)];return{animation:t?`${(0,a.i7)(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${(0,a.i7)(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},c=r.createElement(R,{toast:e}),u=r.createElement(T,{...e.ariaProps},o(e.message,e));return r.createElement(N,{className:e.className,style:{...l,...n,...e.style}},"function"==typeof i?i({icon:c,message:u}):r.createElement(r.Fragment,null,c,u))}));(0,a.mj)(r.createElement);var M=({id:e,className:t,style:n,onHeightUpdate:a,children:o})=>{let i=r.useCallback((t=>{if(t){let n=()=>{let n=t.getBoundingClientRect().height;a(e,n)};n(),new MutationObserver(n).observe(t,{subtree:!0,childList:!0,characterData:!0})}}),[e,a]);return r.createElement("div",{ref:i,className:t,style:n},o)},W=a.AH`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,z=({reverseOrder:e,position:t="top-center",toastOptions:n,gutter:a,children:i,containerStyle:l,containerClassName:f})=>{let{toasts:v,handlers:w}=(e=>{let{toasts:t,pausedAt:n}=((e={})=>{let[t,n]=(0,r.useState)(u),a=(0,r.useRef)(u);(0,r.useEffect)((()=>(a.current!==u&&n(u),c.push(n),()=>{let e=c.indexOf(n);e>-1&&c.splice(e,1)})),[]);let o=t.toasts.map((t=>{var n,r,a;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(n=e[t.type])?void 0:n.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||p[t.type],style:{...e.style,...null==(a=e[t.type])?void 0:a.style,...t.style}}}));return{...t,toasts:o}})(e);(0,r.useEffect)((()=>{if(n)return;let e=Date.now(),r=t.map((t=>{if(t.duration===1/0)return;let n=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(!(n<0))return setTimeout((()=>h.dismiss(t.id)),n);t.visible&&h.dismiss(t.id)}));return()=>{r.forEach((e=>e&&clearTimeout(e)))}}),[t,n]);let a=(0,r.useCallback)((()=>{n&&d({type:6,time:Date.now()})}),[n]),o=(0,r.useCallback)(((e,n)=>{let{reverseOrder:r=!1,gutter:a=8,defaultPosition:o}=n||{},i=t.filter((t=>(t.position||o)===(e.position||o)&&t.height)),s=i.findIndex((t=>t.id===e.id)),l=i.filter(((e,t)=>t<s&&e.visible)).length;return i.filter((e=>e.visible)).slice(...r?[l+1]:[0,l]).reduce(((e,t)=>e+(t.height||0)+a),0)}),[t]);return(0,r.useEffect)((()=>{t.forEach((e=>{if(e.dismissed)((e,t=1e3)=>{if(y.has(e))return;let n=setTimeout((()=>{y.delete(e),d({type:4,toastId:e})}),t);y.set(e,n)})(e.id,e.removeDelay);else{let t=y.get(e.id);t&&(clearTimeout(t),y.delete(e.id))}}))}),[t]),{toasts:t,handlers:{updateHeight:m,startPause:g,endPause:a,calculateOffset:o}}})(n);return r.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...l},className:f,onMouseEnter:w.startPause,onMouseLeave:w.endPause},v.map((n=>{let l=n.position||t,c=((e,t)=>{let n=e.includes("top"),r=n?{top:0}:{bottom:0},a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:s()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(n?1:-1)}px)`,...r,...a}})(l,w.calculateOffset(n,{reverseOrder:e,gutter:a,defaultPosition:t}));return r.createElement(M,{id:n.id,key:n.id,onHeightUpdate:w.updateHeight,className:n.visible?W:"",style:c},"custom"===n.type?o(n.message,n):i?i(n):r.createElement(C,{toast:n,position:l}))})))},L=h},62119:function(e,t,n){"use strict";n.r(t),n.d(t,{MarkdownAsync:function(){return x},MarkdownHooks:function(){return E},default:function(){return b},defaultUrlTransform:function(){return O}});var r=n(97471),a=n(81430),o=n(59061),i=n(74848),s=n(96540),l=n(51638);function c(e){const t=this;t.parser=function(n){return(0,l.Y)(n,{...t.data("settings"),...e,extensions:t.data("micromarkExtensions")||[],mdastExtensions:t.data("fromMarkdownExtensions")||[]})}}var u=n(64160);function d(e,t){return e&&"run"in e?async function(n,r){const a=(0,u._)(n,{file:r,...t});await e.run(a,r)}:function(n,r){return(0,u._)(n,{file:r,...e||t})}}var p=n(5866),f=n(88067),h=n(8826);const m="https://github.com/remarkjs/react-markdown/blob/main/changelog.md",g=[],y={allowDangerousHtml:!0},v=/^(https?|ircs?|mailto|xmpp)$/i,w=[{from:"astPlugins",id:"remove-buggy-html-in-markdown-parser"},{from:"allowDangerousHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"allowNode",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowElement"},{from:"allowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowedElements"},{from:"className",id:"remove-classname"},{from:"disallowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"disallowedElements"},{from:"escapeHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"includeElementIndex",id:"#remove-includeelementindex"},{from:"includeNodeIndex",id:"change-includenodeindex-to-includeelementindex"},{from:"linkTarget",id:"remove-linktarget"},{from:"plugins",id:"change-plugins-to-remarkplugins",to:"remarkPlugins"},{from:"rawSourcePos",id:"#remove-rawsourcepos"},{from:"renderers",id:"change-renderers-to-components",to:"components"},{from:"source",id:"change-source-to-children",to:"children"},{from:"sourcePos",id:"#remove-sourcepos"},{from:"transformImageUri",id:"#add-urltransform",to:"urlTransform"},{from:"transformLinkUri",id:"#add-urltransform",to:"urlTransform"}];function b(e){const t=k(e),n=$(e);return P(t.runSync(t.parse(n),n),e)}async function x(e){const t=k(e),n=$(e);return P(await t.run(t.parse(n),n),e)}function E(e){const t=k(e),[n,r]=(0,s.useState)(void 0),[a,o]=(0,s.useState)(void 0);if((0,s.useEffect)((function(){let n=!1;const a=$(e);return t.run(t.parse(a),a,(function(e,t){n||(r(e),o(t))})),function(){n=!0}}),[e.children,e.rehypePlugins,e.remarkPlugins,e.remarkRehypeOptions]),n)throw n;return a?P(a,e):e.fallback}function k(e){const t=e.rehypePlugins||g,n=e.remarkPlugins||g,r=e.remarkRehypeOptions?{...e.remarkRehypeOptions,...y}:y;return(0,p.l)().use(c).use(n).use(d,r).use(t)}function $(e){const t=e.children||"",n=new h.T;return"string"==typeof t?n.value=t:(0,r.HB)("Unexpected value `"+t+"` for `children` prop, expected `string`"),n}function P(e,t){const n=t.allowedElements,s=t.allowElement,l=t.components,c=t.disallowedElements,u=t.skipHtml,d=t.unwrapDisallowed,p=t.urlTransform||O;for(const e of w)Object.hasOwn(t,e.from)&&(0,r.HB)("Unexpected `"+e.from+"` prop, "+(e.to?"use `"+e.to+"` instead":"remove it")+" (see <"+m+"#"+e.id+"> for more info)");return n&&c&&(0,r.HB)("Unexpected combined `allowedElements` and `disallowedElements`, expected one or the other"),(0,f.YR)(e,(function(e,t,r){if("raw"===e.type&&r&&"number"==typeof t)return u?r.children.splice(t,1):r.children[t]={type:"text",value:e.value},t;if("element"===e.type){let t;for(t in o.$)if(Object.hasOwn(o.$,t)&&Object.hasOwn(e.properties,t)){const n=e.properties[t],r=o.$[t];(null===r||r.includes(e.tagName))&&(e.properties[t]=p(String(n||""),t,e))}}if("element"===e.type){let a=n?!n.includes(e.tagName):!!c&&c.includes(e.tagName);if(!a&&s&&"number"==typeof t&&(a=!s(e,t,r)),a&&r&&"number"==typeof t)return d&&e.children?r.children.splice(t,1,...e.children):r.children.splice(t,1),t}})),(0,a.H)(e,{Fragment:i.Fragment,components:l,ignoreInvalidStyle:!0,jsx:i.jsx,jsxs:i.jsxs,passKeys:!0,passNode:!0})}function O(e){const t=e.indexOf(":"),n=e.indexOf("?"),r=e.indexOf("#"),a=e.indexOf("/");return-1===t||-1!==a&&t>a||-1!==n&&t>n||-1!==r&&t>r||v.test(e.slice(0,t))?e:""}},93146:function(e,t,n){for(var r=n(13491),a="undefined"==typeof window?n.g:window,o=["moz","webkit"],i="AnimationFrame",s=a["request"+i],l=a["cancel"+i]||a["cancelRequest"+i],c=0;!s&&c<o.length;c++)s=a[o[c]+"Request"+i],l=a[o[c]+"Cancel"+i]||a[o[c]+"CancelRequest"+i];if(!s||!l){var u=0,d=0,p=[],f=1e3/60;s=function(e){if(0===p.length){var t=r(),n=Math.max(0,f-(t-u));u=n+t,setTimeout((function(){var e=p.slice(0);p.length=0;for(var t=0;t<e.length;t++)if(!e[t].cancelled)try{e[t].callback(u)}catch(e){setTimeout((function(){throw e}),0)}}),Math.round(n))}return p.push({handle:++d,callback:e,cancelled:!1}),d},l=function(e){for(var t=0;t<p.length;t++)p[t].handle===e&&(p[t].cancelled=!0)}}e.exports=function(e){return s.call(a,e)},e.exports.cancel=function(){l.apply(a,arguments)},e.exports.polyfill=function(e){e||(e=a),e.requestAnimationFrame=s,e.cancelAnimationFrame=l}}}]);