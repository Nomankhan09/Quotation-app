import { View, Text } from 'react-native'
import React from 'react'

const AVATAR_COLORS = [
    "#DBEAFE",
    "#FCE7F3",
    "#D1FAE5",
    "#FEF3C7",
    "#E0E7FF",
    "#FFE4E6",
    "#DCFCE7",
    "#F3E8FF",
];
type Props = {
    item: {
        full_name: string;
    };
};

export default function Avatar({ item }: Props) {
    const getInitials = (name = "") =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const getAvatarColor = (name = "") => {
        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % AVATAR_COLORS.length;
        return AVATAR_COLORS[index];
    };

    const getTextColor = (bgColor: string) => {
        const hex = bgColor.replace("#", "");

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // tuned threshold for pastel-heavy avatar colors
        return brightness > 140 ? "#111827" : "#FFFFFF";
    };

    const bgColor = getAvatarColor(item.full_name);
    const textColor = getTextColor(bgColor);


    return (
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={[styles.avatarText, { color: textColor }]}>
                {getInitials(item.full_name)}
            </Text>
        </View>
    );
}

const styles = {
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontWeight: "700",
        color: "#2563EB",
    },
}