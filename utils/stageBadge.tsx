import { Text, View } from "react-native";

export const StageBadge = ({ stage, size }: { stage: string, size?: number }) => {
    const getColor = (stage: string) => {
        switch (stage) {
            case "Lead":
                return { bg: "#DBEAFE", text: "#2563EB" };
            case "Proposal":
                return { bg: "#E9D5FF", text: "#7C3AED" };
            case "Negotiation":
                return { bg: "#FEF3C7", text: "#D97706" };
            case "Won":
                return { bg: "#D1FAE5", text: "#059669" };
            default:
                return { bg: "#E5E7EB", text: "#374151" };
        }
    };

    const color = getColor(stage);

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: color.bg,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999, // fully pill shape
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
            }}
        >
            {/* small dot indicator */}
            <View
                style={{
                    width: size ?? 6,
                    height: size ?? 6,
                    borderRadius: (size ?? 6) / 2,
                    backgroundColor: color.text,
                    marginRight: 6,
                    opacity: 0.8,
                }}
            />

            <Text
                style={{
                    color: color.text,
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 0.2,
                }}
            >
                {stage}
            </Text>
        </View>
    );
};