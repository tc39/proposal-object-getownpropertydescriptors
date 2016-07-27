'use strict';

if (typeof Reflect === 'undefined') {
  global.Reflect = {
    defineProperty: Object.defineProperty,
    getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,
    ownKeys: function ownKeys(genericObject) {
      let gOPS = Object.getOwnPropertySymbols || function () { return []; };
      return Object.getOwnPropertyNames(genericObject)
              .concat(gOPS(genericObject));
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
      // Let `obj` be ? `ToObject(O)`
      if (Object(genericObject) !== genericObject) {
        throw new Error('Argument should be an object');
      }

      // Let `ownKeys` be the result of calling ? `obj.[[OwnPropertyKeys]]()`
      let ownKeys;
      try {
        ownKeys = Reflect.ownKeys(genericObject);
      } catch(e) {
        throw new Error('Unable to retrieve own keys');
      }

      // Let `descriptors` be ? `ObjectCreate(%ObjectPrototype%)`
      let descriptors;
      try {
        descriptors = Object.create(Object.prototype);
      } catch(e) {
        throw new Error('Unable to create an instance of Object.prototype');
      }

      // Repeat, for each element `key` of `ownKeys` in List order
      for (let key of ownKeys) {

        // Let `desc` be the result of ? `obj.[[GetOwnProperty]](key)`
        // Let `descriptor` be ? `FromPropertyDescriptor(desc)`
        let descriptor = Reflect.getOwnPropertyDescriptor(genericObject, key);

        if (typeof descriptor !== 'undefined') {
          // Let `status` be the result of ? `CreateDataProperty(descriptors, key, descriptor)`
          try {
            Reflect.defineProperty(descriptors, key, {
              configurable: true,
              enumerable: true,
              writable: true,
              value: descriptor
            });
          } catch(e) {
            throw new Error('Unable to create a data propoerty');
          }
        }
      }

      // Return `descriptors`
      return descriptors;
    }
  }
);