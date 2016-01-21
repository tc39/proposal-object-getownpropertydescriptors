# `Object.getOwnPropertyDescriptors` Proposal




## Status

This proposal is currently in stage 0 of [the TC39 process](https://github.com/tc39/ecma262/blob/master/stage0.md).

This proposal could be identical to a `Reflect.getOwnPropertyDescriptors` one but for consistency with other plural versions it's described as `Object` public static method.




## Motivation

There is not a single method in ECMAScript capable of simplifying the copy between two objects.
In these days more than ever, where functional programming and immutable objects are essential parts of complex applications, every framework or library is implementing its own boilerplate in order to properly copy properties between composed objects or prototypes.

Even if highly optimized, the amount of operations needed in order to obtain an object compatible with `Object.defineProperties` or with the second argument of `Object.create` is huge and it could be surely improved if performed directly in core.

There is also a lot of confusion and most of the time undesired behavior when it comes to fallback to `Object.assign` because it copies in a swallow way, accessed properties and symbols instead of their descriptors, discarding possible accessors which is an hazard when it come to compose prototype objects.




## FAQs

### Should there be a `Reflect.getOwnPropertyDescriptors` ?

Since the main goal of this proposal is to simplify some common boilerplate and be consistent with the fact there is a singular version of the method but not a plural one, it might be further consistent to have the plural version of the current [Reflect.getOwnPropertyDescriptor](http://www.ecma-international.org/ecma-262/6.0/#sec-reflect.getownpropertydescriptor) method too.




## Proposed Solution

As plural version of `Object.getOwnPropertyDescriptor`, this proposal is about retrieving in one single operation all possible own descriptors of a generic object.

A **polyfill** of such proposal would look like the following:
```js
if (!Object.hasOwnProperty('getOwnPropertyDescriptors')) {
  Object.defineProperty(
    Object,
    'getOwnPropertyDescriptors',
    {
      configurable: true,
      writable: true,
      value: function getOwnPropertyDescriptors(object) {
        return Reflect.ownKeys(object).reduce((descriptors, key) => {
          let descriptor = Object.getOwnPropertyDescriptor(object, key);
          descriptors[key] = descriptor;
          return descriptors;
        }, {});
      }
    }
  );
}
```


## Illustrative Examples

The polyfill shows an alternative, ES2015 friendly, way that improves the boilerplate needed for engines compatible with ES5 and partially with ES2015, yet it's a very handy boilerplate that could be faster in core and it could simplify real shallow copy or clone between objects through operations like the following:
```js
const shallowClone = (object) => Object.create(
  Object.getPrototypeOf(object),
  Object.getOwnPropertyDescriptors(object)
);

const shallowMerge = (target, source) => Object.defineProperties(
  target,
  Object.getOwnPropertyDescriptors(source)
);
```

Possible objects based mixin solutions could also benefit from this proposal:
```js
let mix = (object) => ({
  with: (...mixins) => mixins.reduce(
    (c, mixin) => Object.create(
      c, Object.getOwnPropertyDescriptors(mixin)
    ), object)
});

// multiple mixins example
let a = {a: 'a'};
let b = {b: 'b'};
let c = {c: 'c'};
let d = mix(c).with(a, b);
```


A boilerplate example capable of solving what `Object.assign` is not covering with current ES2015 capabilities is shown here:
```js
function completeAssign(target, ...sources) {
  sources.forEach(source => {
    // grab keys descriptors
    let descriptors = Object.keys(source).reduce((descriptors, key) => {
      descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
      return descriptors;
    }, {});
    // by default, Object.assign copies enumerable Symbols too
    // so grab and filter Symbols as well
    Object.getOwnPropertySymbols(source).forEach(sym => {
      let descriptor = Object.getOwnPropertyDescriptor(source, sym);
      if (descriptor.enumerable) {
        descriptors[sym] = descriptor;
      }
    });
    Object.defineProperties(target, descriptors);
  });
  return target;
}
```

However, if `Object.getOwnPropertyDescriptors` was available, above boilerplate would look much simpler:
```js
var completeAssign = (target, ...sources) =>
  sources.reduce((target, source) => {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    Reflect.ownKeys(descriptors).forEach(key => {
      if (!descriptors[key].enumerable) {
        delete descriptors[key];
      }
    });
    return Object.defineProperties(target, descriptors);
  }, target);
```