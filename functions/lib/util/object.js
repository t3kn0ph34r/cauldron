'use strict';
const ERR_CIRCULAR = 'Cannot deep-copy circular structures';
/**
 *
 * @param {*} target
 * @param {...*} source
 */
function deepMerge(target) {
    let references = new WeakSet();
    let sources = [].slice.call(arguments, 1);

    function _deepMerge(target, source) {
        if (typeof target !== 'object') {
            return deepCopy(source);
        }

        if (typeof source !== 'object') {
            return source;
        }

        if (!references.has(source)) {
            references.add(source);
        }

        if (!references.has(target)) {
            references.add(target);
        }

        if (Array.isArray(source)) {
            return deepCopyArray(source);
        }

        for (let prop in source) {
            if (references.has(target[prop]) || references.has(source[prop])) {
                throw new Error(ERR_CIRCULAR);
            }

            target[prop] = _deepMerge(target[prop], source[prop]);
        }

        return target;
    }

    sources.forEach(source => {
        target = _deepMerge(target, source);
    });

    return target;
}

/**
 * return
 *
 * @param {*[]} arr
 */
function deepCopyArray(arr) {
    let references = new WeakSet();

    function _deepCopyArray(arr) {
        if (references.has(arr)) {
            throw new Error(ERR_CIRCULAR);
        }

        references.add(arr);

        return arr.map(elem => {
            if (Array.isArray(elem)) {
                return _deepCopyArray(elem);
            }

            return deepCopy(elem);
        });
    }

    return _deepCopyArray(arr);
}

/**
 *
 * @param target
 */
function deepCopy(target) {
    return deepMerge.call(null, {}, target);
}


module.exports = {
    deepCopy,
    deepMerge
};