import { View, ScrollView, Text } from "react-native";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { StatusChip } from "../components/StatusChip";
import { typography } from "../constants/theme";

export default function Index() {
  return (
    <ScrollView className="flex-1 bg-background pt-12 pb-8 px-4">
      <Text className="text-[32px] font-poppins-bold text-text-primary mb-2">Design System</Text>
      
      <View className="mb-8">
        <Text className="text-[20px] font-poppins-semibold text-text-primary mb-4">Typography</Text>
        <Text className={typography.h1}>H1 Page Title</Text>
        <Text className={typography.h2}>H2 Section Title</Text>
        <Text className={typography.h3}>H3 Card Title</Text>
        <Text className={typography.h4}>H4 Subheading</Text>
        <Text className={typography.bodyL}>Body L Important Text</Text>
        <Text className={typography.bodyM}>Body M Body Text</Text>
        <Text className={typography.bodyS}>Body S Supporting Text</Text>
        <Text className={typography.caption}>Caption Labels / Meta</Text>
      </View>

      <View className="mb-8 space-y-4">
        <Text className="text-[20px] font-poppins-semibold text-text-primary mb-2">Buttons</Text>
        <View style={{ gap: 12 }}>
          <Button title="Primary Button" variant="primary" />
          <Button title="Secondary Button" variant="secondary" />
          <Button title="Outline Button" variant="outline" />
          <Button title="Destructive Button" variant="destructive" />
        </View>
      </View>

      <View className="mb-8 space-y-4">
        <Text className="text-[20px] font-poppins-semibold text-text-primary mb-2">Input Fields</Text>
        <View style={{ gap: 16 }}>
          <Input placeholder="Enter text" leftIcon="user" />
          <Input placeholder="Typing..." leftIcon="user" autoFocus />
          <Input placeholder="Invalid input" leftIcon="user" error="This field is required." />
        </View>
      </View>

      <View className="mb-12">
        <Text className="text-[20px] font-poppins-semibold text-text-primary mb-4">Status Chips</Text>
        <View className="flex-row flex-wrap gap-3" style={{ gap: 12 }}>
          <StatusChip status="paid" />
          <StatusChip status="due" />
          <StatusChip status="overdue" />
          <StatusChip status="upcoming" />
          <StatusChip status="partial" />
        </View>
      </View>
    </ScrollView>
  );
}
