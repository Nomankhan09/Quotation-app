import { Text, View } from "react-native";

export const hexToRGBA = (hex: string, alpha: number) => {

    if (!hex.startsWith("#")) {
        return `rgba(100,100,100,${alpha})`;
    }

    const cleanHex = hex.replace("#", "");

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const StageBadge = ({
    stage,
    color,
    size,
}: {
    stage: string;
    color?: string;
    size?: number;
}) => {

    const safeColor = color || "#64748B";


    const bgColor = hexToRGBA(safeColor, 0.12);

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: bgColor,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: hexToRGBA(safeColor, 0.2),
            }}
        >
            <View
                style={{
                    width: size ?? 6,
                    height: size ?? 6,
                    borderRadius: (size ?? 6) / 2,
                    backgroundColor: safeColor,
                    marginRight: 6,
                }}
            />

            <Text
                style={{
                    color: safeColor,
                    fontSize: 11,
                    fontWeight: "600",
                }}
            >
                {stage}
            </Text>
        </View>
    );
};