import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";

type VaultCategory = "Report" | "KYC" | "Tax" | "Review";

type VaultDocument = {
  id: string;
  clientName: string;
  fileName: string;
  category: VaultCategory;
  date: string;
  status: "Stored" | "Shared";
};

type VaultDocumentDraft = {
  clientName: string;
  fileName: string;
  category: VaultCategory;
};

interface VaultScreenProps {
  documents: VaultDocument[];
  draft: VaultDocumentDraft;
  onBack: () => void;
  onSave: () => void;
  onUpdateDraft: <K extends keyof VaultDocumentDraft>(key: K, value: VaultDocumentDraft[K]) => void;
  styles: ReturnType<typeof StyleSheet.create>;
}

export function VaultScreen({
  documents,
  draft,
  onBack,
  onSave,
  onUpdateDraft,
  styles,
}: VaultScreenProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.sectionHeader}>
        <Text style={styles.panelTitle}>Document vault</Text>
        <Pressable onPress={onBack} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.panelSubtitle}>
        Secure metadata storage for reports, KYC, tax files, and review packs.
      </Text>
      <TextInput
        value={draft.clientName}
        onChangeText={(value) => onUpdateDraft("clientName", value)}
        placeholder="Client name"
        placeholderTextColor="#7f90a8"
        style={styles.input}
      />
      <TextInput
        value={draft.fileName}
        onChangeText={(value) => onUpdateDraft("fileName", value)}
        placeholder="Document file name"
        placeholderTextColor="#7f90a8"
        style={styles.input}
      />
      <View style={styles.optionRow}>
        {(["Report", "KYC", "Tax", "Review"] as const).map((option) => {
          const active = draft.category === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, active ? styles.optionChipActive : null]}
              onPress={() => onUpdateDraft("category", option)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  active ? styles.optionChipTextActive : null,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={styles.goldButton} onPress={onSave}>
        <Text style={styles.goldButtonText}>Add to Vault</Text>
      </Pressable>
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Vault is empty</Text>
          <Text style={styles.emptyText}>
            Store report, KYC, tax, and review document entries here.
          </Text>
        </View>
      ) : (
        documents.slice(0, 8).map((doc) => (
          <View key={doc.id} style={styles.analyticsListCard}>
            <Text style={styles.clientName}>{doc.fileName}</Text>
            <Text style={styles.clientMeta}>
              {doc.clientName} | {doc.category} | {doc.status}
            </Text>
            <Text style={styles.clientSubMeta}>{doc.date}</Text>
          </View>
        ))
      )}
    </View>
  );
}
