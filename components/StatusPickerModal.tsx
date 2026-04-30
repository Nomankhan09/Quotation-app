import React from 'react';

import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

type Props = {
    visible: boolean;
    onClose: () => void;

    statuses: any[];

    currentStatus?: string;

    loading?: boolean;

    onSelect: (
        status: string
    ) => void;
};

export default function StatusPickerModal({
    visible,
    onClose,
    statuses,
    currentStatus,
    loading,
    onSelect,
}: Props) {

    return (

        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >

            <TouchableOpacity
                activeOpacity={1}
                style={styles.overlay}
                onPress={onClose}
            >

                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modal}
                >

                    <Text style={styles.title}>
                        Change Status
                    </Text>

                    <ScrollView
                        persistentScrollbar
                        bounces
                        contentContainerStyle={{
                            paddingBottom: 8,
                        }}
                    >

                        {statuses.map((item: any) => {

                            const active =
                                item.status === currentStatus;

                            return (

                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.item}
                                    disabled={loading}
                                    onPress={() =>
                                        onSelect(
                                            item.status
                                        )
                                    }
                                >

                                    <View style={styles.left}>

                                        <View
                                            style={[
                                                styles.dot,
                                                {
                                                    backgroundColor:
                                                        item.color
                                                }
                                            ]}
                                        />

                                        <Text
                                            style={[
                                                styles.name,
                                                active && {
                                                    color:
                                                        item.color,
                                                    fontWeight: '700',
                                                }
                                            ]}
                                        >
                                            {item.status}
                                        </Text>

                                    </View>

                                    {active && (

                                        <View
                                            style={[
                                                styles.checkWrap,
                                                {
                                                    backgroundColor:
                                                        item.color
                                                }
                                            ]}
                                        >

                                            <Ionicons
                                                name="checkmark"
                                                size={12}
                                                color="#fff"
                                            />

                                        </View>
                                    )}

                                </TouchableOpacity>
                            );
                        })}

                    </ScrollView>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={onClose}
                    >

                        <Text style={styles.cancelText}>
                            Cancel
                        </Text>

                    </TouchableOpacity>

                </TouchableOpacity>

            </TouchableOpacity>

        </Modal>
    );
}

const styles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    modal: {
        width: '100%',
        maxWidth: 420,

        backgroundColor: '#FFFFFF',

        borderRadius: 24,

        overflow: 'hidden',

        maxHeight: '72%',
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',

        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 14,
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        paddingHorizontal: 22,
        paddingVertical: 18,

        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },

    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginRight: 14,
    },

    name: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },

    checkWrap: {
        width: 22,
        height: 22,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelBtn: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',

        paddingVertical: 18,
        alignItems: 'center',
    },

    cancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2563EB',
    },
});