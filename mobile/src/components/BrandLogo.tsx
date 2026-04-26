import { Image, ImageStyle, StyleProp } from "react-native";

const logoSource = require("../../assets/icon.png");

type BrandLogoProps = {
    size?: number;
    borderRadius?: number;
    style?: StyleProp<ImageStyle>;
};

export default function BrandLogo({
    size = 72,
    borderRadius = 18,
    style,
}: BrandLogoProps) {
    return (
        <Image
            source={logoSource}
            accessibilityLabel="CodeSense AI Logo"
            resizeMode="cover"
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius,
                },
                style,
            ]}
        />
    );
}
