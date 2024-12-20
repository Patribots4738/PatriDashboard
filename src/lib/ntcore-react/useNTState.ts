// https://github.com/CrispyBacon1999/ntcore-react/tree/main/src/lib
// The packaged version of this was buggy so I tossed it in here

import { NetworkTablesTopic, NetworkTablesTypeInfo } from "ntcore-ts-client";
import { useContext, useEffect, useState } from "react";
import NTContext from "./NTContext";
import NTTopicTypes from "./NTTopicTypes";

const useNTState = <T extends NTTopicTypes>(
    key: string,
    ntType: NetworkTablesTypeInfo,
    defaultValue: T
): [
    T,
    (
        value: T,
        publishProperties?: {
            persistent?: boolean;
            retained?: boolean;
            id?: number;
        }
    ) => void
] => {
    const client = useContext(NTContext);
    const [topic, setTopic] = useState<NetworkTablesTopic<T> | null>(null);
    const [value, setValue] = useState<T>(defaultValue);

    useEffect(() => {
        if (client) {
            const listener = (value: T | null) => {
                setValue(value ?? defaultValue);
            };
            const clientTopic = client.createTopic(key, ntType, defaultValue);
            const subscriptionUID = clientTopic.subscribe(listener);
            setTopic(clientTopic);

            return () => {
                if (subscriptionUID && clientTopic) {
                    clientTopic.unsubscribe(subscriptionUID);
                }
            };
        } else {
            throw new Error(
                "No NTProvider found. Please wrap your application in an NTProvider"
            );
        }
    }, [key, client]);

    /**
     * Set the value of the topic
     *
     * Will likely throw an error if multiple apps try to set the value at the same time
     * @param value Value to set
     * @param publishProperties Properties to pass to the publish method
     */
    const setNTValue = (
        value: T,
        publishProperties?: {
            persistent?: boolean;
            retained?: boolean;
            id?: number;
        }
    ) => {
        if (topic) {
            topic.announce(publishProperties?.id ?? undefined!);
            topic.publish(publishProperties);
            topic.setValue(value);
            setValue(value);
        }
    };

    return [value, setNTValue];
};

export default useNTState;