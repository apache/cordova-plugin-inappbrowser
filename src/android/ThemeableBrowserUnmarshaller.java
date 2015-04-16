/*
 * Copyright (C) 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.initialxy.cordova.themeablebrowser;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Array;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

/**
 * This is a simple and half decent JSON to POJO unmarshaller inspired by
 * Jackson. It is only a unmarshaller without a marshaller. It is intended to
 * parse JSON passed to a plugin as options to a POJO. It is nowhere as powerful
 * as Jackson is, but for most use cases, it will do a pretty decent job since
 * it is designed to be used for general purpose unmarshalling. This avoid
 * having to import Jackson or JAXB for merely a Cordova plugin. ~350 lines
 * isn't too big right?
 */
public class ThemeableBrowserUnmarshaller {
    /**
     * Runtime exception to notify type mismatch between expected class
     * structure and JSON.
     */
    public static class TypeMismatchException extends RuntimeException {
        public TypeMismatchException(Type expected, Type got) {
            super(String.format("Expected %s but got %s.", expected, got));
        }

        public TypeMismatchException(String message) {
            super(message);
        }
    }

    /**
     * Runtime exception to notify errors during class initialization.
     */
    public static class ClassInstantiationException extends RuntimeException {
        public ClassInstantiationException(Class<?> cls) {
            super(String.format("Failed to instantiate %s", cls));
        }

        public ClassInstantiationException(String message) {
            super(message);
        }
    }

    /**
     * Runtime exception to notify parser errors.
     */
    public static class ParserException extends RuntimeException {
        public ParserException(Exception e) {
            super(e);
        }
    }

    /**
     * Given a JSON string, unmarhall it to an instance of the given class.
     *
     * @param json JSON string to unmarshall.
     * @param cls Return an instance of this class. Must be either public class
     *            or private static class. Inner class will not work.
     * @param <T> Same type as cls.
     * @return An instance of class given by cls.
     * @throws com.initialxy.cordova.themeablebrowser.ThemeableBrowserUnmarshaller.TypeMismatchException
     */
    public static <T> T JSONToObj(String json, Class<T> cls) {
        T result = null;

        if (json != null && !json.isEmpty()) {
            try {
                JSONObject jsonObj = new JSONObject(json);
                result = JSONToObj(jsonObj, cls);
            } catch (JSONException e) {
                throw new ParserException(e);
            }
        }

        return result;
    }

    /**
     * Given a JSONObject, unmarhall it to an instance of the given class.
     *
     * @param jsonObj JSON string to unmarshall.
     * @param cls Return an instance of this class. Must be either public class
     *            or private static class. Inner class will not work.
     * @param <T> Same type as cls.
     * @return An instance of class given by cls.
     * @throws com.initialxy.cordova.themeablebrowser.ThemeableBrowserUnmarshaller.TypeMismatchException
     */
    public static <T> T JSONToObj(JSONObject jsonObj, Class<T> cls) {
        T result = null;

        try {
            Constructor<T> constructor = cls.getDeclaredConstructor();
            constructor.setAccessible(true);
            result = (T) constructor.newInstance();
            Iterator<?> i = jsonObj.keys();

            while (i.hasNext()) {
                String k = (String) i.next();
                Object val = jsonObj.get(k);

                try {
                    Field field = cls.getField(k);
                    Object converted = valToType(val, field.getGenericType());

                    if (converted == null) {
                        if (!field.getType().isPrimitive()) {
                            field.set(result, null);
                        } else {
                            throw new TypeMismatchException(String.format(
                                    "Type %s cannot be set to null.",
                                    field.getType()));
                        }
                    } else {
                        if (converted instanceof List
                                && field.getType()
                                .isAssignableFrom(List.class)) {
                            // Class can define their own favorite
                            // implementation of List. In which case the field
                            // still need to be defined as List, but it can be
                            // initialized with a placeholder instance of any of
                            // the List implementations (eg. ArrayList).
                            Object existing = field.get(result);
                            if (existing != null) {
                                ((List<?>) existing).clear();

                                // Just because I don't want javac to complain
                                // about unsafe operations. So I'm gonna use
                                // more reflection, HA!
                                Method addAll = existing.getClass()
                                        .getMethod("addAll", Collection.class);
                                addAll.invoke(existing, converted);
                            } else {
                                field.set(result, converted);
                            }
                        } else {
                            field.set(result, converted);
                        }
                    }
                } catch (NoSuchFieldException e) {
                    // Ignore.
                } catch (IllegalAccessException e) {
                    // Ignore.
                } catch (IllegalArgumentException e) {
                    // Ignore.
                }
            }
        } catch (JSONException e) {
            throw new ParserException(e);
        } catch (NoSuchMethodException e) {
            throw new ClassInstantiationException(
                    "Failed to retrieve constructor for "
                    + cls.toString() + ", make sure it's not an inner class.");
        } catch (InstantiationException e) {
            throw new ClassInstantiationException(cls);
        } catch (IllegalAccessException e) {
            throw new ClassInstantiationException(cls);
        } catch (InvocationTargetException e) {
            throw new ClassInstantiationException(cls);
        }

        return result;
    }

    /**
     * Given an object extracted from JSONObject field, convert it to an
     * appropriate object with type appropriate for given type so that it can be
     * assigned to the associated field of the ummarshalled object. eg.
     * JSONObject value from a JSONObject field probably needs to be
     * unmarshalled to a class instance. Double from JSONObject may need to be
     * converted to Float. etc.
     *
     * @param val Value extracted from JSONObject field.
     * @param genericType Type to convert to. Must be generic type. ie. From
     *                    field.getGenericType().
     * @return Object of the given type so it can be assinged to field with
     * field.set().
     * @throws com.initialxy.cordova.themeablebrowser.ThemeableBrowserUnmarshaller.TypeMismatchException
     */
    private static Object valToType(Object val, Type genericType) {
        Object result = null;
        boolean isArray = false;

        Class<?> rawType = null;
        if (genericType instanceof ParameterizedType) {
            rawType = (Class<?>) ((ParameterizedType) genericType).getRawType();
        } else if (genericType instanceof GenericArrayType) {
            rawType = List.class;
            isArray = true;
        } else {
            rawType = (Class<?>) genericType;
        }

        isArray = isArray || rawType.isArray();
 
        if (val != null && val != JSONObject.NULL) {
            if (rawType.isAssignableFrom(String.class)) {
                if (val instanceof String) {
                    result = val;
                } else {
                    throw new TypeMismatchException(rawType, val.getClass());
                }
            } else if (isPrimitive(rawType)) {
                result = convertToPrimitiveFieldObj(val, rawType);
            } else if (isArray || rawType.isAssignableFrom(List.class)) {
                if (val instanceof JSONArray) {
                    Type itemType = getListItemType(genericType);
                    result = JSONToList((JSONArray) val, itemType);

                    if (isArray) {
                        List<?> list = (List<?>) result;

                        Class<?> itemClass = null;
                        if (itemType instanceof ParameterizedType) {
                            itemClass = (Class<?>) ((ParameterizedType) itemType).getRawType();
                        } else {
                            itemClass = (Class<?>) itemType;
                        }

                        result = Array.newInstance(itemClass, list.size());
                        int cnt = 0;
                        for (Object i : list) {
                            Array.set(result, cnt, i);
                            cnt += 1;
                        }
                    }
                } else {
                    throw new TypeMismatchException(
                            JSONArray.class, val.getClass());
                }
            } else if (val instanceof JSONObject) {
                result = JSONToObj((JSONObject) val, rawType);
            }
        }

        return result;
    }

    /**
     * Given a generic type representing a List or array, retrieve list or array
     * item type.
     *
     * @param type
     * @return
     */
    private static Type getListItemType(Type type) {
        Type result = null;
        
        if (type instanceof GenericArrayType) {
            result = ((GenericArrayType) type).getGenericComponentType();
        } else if (type instanceof ParameterizedType){
            result = ((ParameterizedType) type).getActualTypeArguments()[0];
        } else {
            result = ((Class<?>) type).getComponentType();
        }

        return result;
    }

    /**
     * Given an JSONArray retrieved from JSONObject, and the destination item
     * type, unmarshall this list to a List of given item type.
     *
     * @param jsonArr
     * @param itemType
     * @return
     */
    private static List<?> JSONToList(JSONArray jsonArr, Type itemType) {
        List<Object> result = new ArrayList<Object>();

        Class<?> rawType = null;
        ParameterizedType pType = null;

        if (itemType instanceof ParameterizedType) {
            pType = (ParameterizedType) itemType;
            rawType = (Class<?>) pType.getRawType();
        } else {
            rawType = (Class<?>) itemType;
        }

        int len = jsonArr.length();
        for (int i = 0; i < len; i++) {
            try {
                Object item = jsonArr.get(i);
                Object converted = valToType(item, itemType);
                if (converted != null) {
                    result.add(converted);
                }
            } catch (JSONException e) {
                throw new ParserException(e);
            }
        }

        return result;
    }

    /**
     * Checks if given class is one of the primitive types or more importantly,
     * one of the classes associated with a primitive type. eg. Integer, Double
     * etc.
     *
     * @param cls
     * @return
     */
    private static boolean isPrimitive(Class<?> cls) {
        return cls.isPrimitive()
                || cls.isAssignableFrom(Byte.class)
                || cls.isAssignableFrom(Short.class)
                || cls.isAssignableFrom(Integer.class)
                || cls.isAssignableFrom(Long.class)
                || cls.isAssignableFrom(Float.class)
                || cls.isAssignableFrom(Double.class)
                || cls.isAssignableFrom(Boolean.class)
                || cls.isAssignableFrom(Character.class);
    }

    /**
     * Gracefully convert given Object to given class given the precondition
     * that both are primitives or one of the classes associated with
     * primitives. eg. If val is of type Double and cls is of type int, return
     * Integer type with appropriate value truncation so that it can be assigned
     * to field with field.set().
     *
     * @param cls
     * @param val
     * @return
     * @throws com.initialxy.cordova.themeablebrowser.ThemeableBrowserUnmarshaller.TypeMismatchException
     */
    private static Object convertToPrimitiveFieldObj(Object val, Class<?> cls) {
        Class<?> valClass = val.getClass();
        Object result = null;

        try {
            Method getter = null;
            if (cls.isAssignableFrom(Byte.class)
                    || cls.isAssignableFrom(Byte.TYPE)) {
                getter = valClass.getMethod("byteValue");
            } else if (cls.isAssignableFrom(Short.class)
                    || cls.isAssignableFrom(Short.TYPE)) {
                getter = valClass.getMethod("shortValue");
            } else if (cls.isAssignableFrom(Integer.class)
                    || cls.isAssignableFrom(Integer.TYPE)) {
                getter = valClass.getMethod("intValue");
            } else if (cls.isAssignableFrom(Long.class)
                    || cls.isAssignableFrom(Long.TYPE)) {
                getter = valClass.getMethod("longValue");
            } else if (cls.isAssignableFrom(Float.class)
                    || cls.isAssignableFrom(Float.TYPE)) {
                getter = valClass.getMethod("floatValue");
            } else if (cls.isAssignableFrom(Double.class)
                    || cls.isAssignableFrom(Double.TYPE)) {
                getter = valClass.getMethod("doubleValue");
            } else if (cls.isAssignableFrom(Boolean.class)
                    || cls.isAssignableFrom(Boolean.TYPE)) {
                if (val instanceof Boolean) {
                    result = val;
                } else {
                    throw new TypeMismatchException(cls, val.getClass());
                }
            } else if (cls.isAssignableFrom(Character.class)
                    || cls.isAssignableFrom(Character.TYPE)) {
                if (val instanceof String && ((String) val).length() == 1) {
                    char c = ((String) val).charAt(0);
                    result = Character.valueOf(c);
                } else if (val instanceof String) {
                    throw new TypeMismatchException(
                            "Expected Character, "
                            + "but received String with length other than 1.");
                } else {
                    throw new TypeMismatchException(String.format(
                            "Expected Character, accept String, but got %s.",
                            val.getClass()));
                }
            }

            if (getter != null) {
                result = getter.invoke(val);
            }
        } catch (NoSuchMethodException e) {
            throw new TypeMismatchException(String.format(
                    "Cannot convert %s to %s.", val.getClass(), cls));
        } catch (SecurityException e) {
            throw new TypeMismatchException(String.format(
                    "Cannot convert %s to %s.", val.getClass(), cls));
        } catch (IllegalAccessException e) {
            throw new TypeMismatchException(String.format(
                    "Cannot convert %s to %s.", val.getClass(), cls));
        } catch (InvocationTargetException e) {
            throw new TypeMismatchException(String.format(
                    "Cannot convert %s to %s.", val.getClass(), cls));
        }

        return result;
    }
}
