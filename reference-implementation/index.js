'use strict';

if (typeof Reflect === 'undefined') {
  global.Reflect = {
    ownKeys: function ownKeys(genericObject) {
      return Object.getOwnPropertyNames(genericObject)
              .concat(Object.getOwnPropertySymbols(genericObject));
    }
  };
}

Object.defineProperty(
  Object,
  'getOwnPropertyDescriptors',
  {
    configurable: true,
    writable: true,
    value: function getOwnPropertyDescriptors(genericObject) {
      let keys;
      // Let obj be ToObject(O)
      if (Object(genericObject) !== genericObject) {
        // ReturnIfAbrupt(obj)
        throw new Error('Argument should be an object');
      }
      try {
        // Let keys be the result of calling the [[OwnPropertyKeys]]
        // internal method of obj.
        keys = Reflect.ownKeys(genericObject);
      } catch(e) {
        // ReturnIfAbrupt(keys)
        throw new Error('Unable to retrieve own keys');
      }
      // Let descriptors be the result of the abstract operation ObjectCreate
      // with the intrinsic object %ObjectPrototype% as its argument.
      let descriptors = {};
      // Let gotAllNames be false.
      let gotAllNames = keys.length === 0;
      // Repeat while gotAllNames is false,
      while (gotAllNames === false) {
        // Let nextKey be IteratorValue(next).
        // Let nextKey be ToPropertyKey(nextKey).
        let nextKey = keys.shift();
        // If next is false, then let gotAllNames be true.
        gotAllNames = keys.length === 0;
        if (nextKey === undefined) {
          // ReturnIfAbrupt(nextKey).
          throw new Error('Unable to iterate over own keys');
        }
        // Let desc be the result of calling the [[GetOwnProperty]] internal method of obj with argument nextKey.
        // Let descriptor be FromPropertyDescriptor(desc).
        let descriptor = Object.getOwnPropertyDescriptor(genericObject, nextKey);
        if (descriptor === undefined) {
          // ReturnIfAbrupt(descriptor).
          throw new Error('Unable to retrieve own property descriptor');
        }
        // Let status be the result of CreateDataProperty(descriptors, nextKey, descriptor).
        try {
          // Assert: status is not an abrupt completion.
          descriptors[nextKey] = descriptor;
        } catch(e) {
          throw new Error('Unable to create descriptors');
        }
      }
      // Return descriptors.
      return descriptors;
    }
  }
);