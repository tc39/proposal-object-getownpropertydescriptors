# `Object.getOwnPropertyDescriptors` Proposal ([Polyfill](https://www.npmjs.com/package/object.getownpropertydescriptors))


## Champion

At stage 0 [Rick Waldron](https://github.com/rwaldron) agreed to champion this proposal.
However the **current** official Champion is **[Jordan Harband](https://github.com/ljharb)**.



## Status

This proposal is currently in [stage 4](https://github.com/tc39/proposals/blob/master/finished-proposals.md) of [the TC39 process](https://github.com/tc39/ecma262/).

This proposal could be identical to a `Reflect.getOwnPropertyDescriptors` one but for consistency with other plural versions it's described as an `Object` public static method.

## Motivation

There is not a single method in ECMAScript capable of simplifying a proper copy between two objects.
In these days more than ever, where functional programming and immutable objects are essential parts of complex applications, every framework or library is implementing its own boilerplate in order to properly copy properties between composed objects or prototypes.

There is a lot of confusion and most of the time undesired behavior when it comes to fallback to `Object.assign` because it copies in a way that swallows behavior: it directly accesses properties and symbols instead of their descriptors, discarding possible accessors which could result into an hazard when it come to composing more complex objects or classes’ prototypes.

Retrieving all descriptors, enumerable or not, is also key to implementing composition over `class`es and their prototypes, since by default they have non-enumerable methods and accessors.

Also decorators could easily grab at once all descriptors from another class or mixin and assign them through `Object.defineProperties`.
Filtering undesired descriptors would be simpler too, as well as less repetitive each time is needed.

Last, but not least, a shallow copy between two unknown objects would be free of surprises compared to what `Object.assign` would do.


## FAQs

### Should there be a `Reflect.getOwnPropertyDescriptors` ?

Since the main goal of this proposal is to simplify some common boilerplate and be consistent with the fact there is a singular version of the method but not a plural one, it might be further consistent to have the plural version of the current [Reflect.getOwnPropertyDescriptor](http://www.ecma-international.org/ecma-262/6.0/#sec-reflect.getownpropertydescriptor) method too.

Update: The committee has previously decided that `Reflect` is solely to mirror `Proxy` traps, so this is not an option.


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
          return Object.defineProperty(
            descriptors,
            key,
            {
              configurable: true,
              enumerable: true,
              writable: true,
              value: Object.getOwnPropertyDescriptor(object, key)
            }
          );
        }, {});
      }
    }
  );
}
```


## Illustrative Examples

The polyfill shows an alternative, ES2015 friendly, way that improves the boilerplate needed for engines compatible with ES5 or partially with ES2015.

Now that `Object.getOwnPropertyDescriptors` is in place, all it's needed in order to make a real shallow copy or clone operation between two objects, is shown in the following example:
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


Let's say you wanted a version of Object.assign that uses `[[DefineOwnProperty]]`/`[[GetOwnProperty]]` instead of `[[Set]]`/`[[Get]]`, to avoid side effects and copy setters/getters, but still use enumerability as the distinguishing factor.

Before this proposal, such a method would look like:
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

However, if `Object.getOwnPropertyDescriptors` was available, above boilerplate would look like:
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
