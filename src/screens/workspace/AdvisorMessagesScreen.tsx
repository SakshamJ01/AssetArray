import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { AnimatedPressable as Pressable } from "../../components/AnimatedPressable";

type AdvisorMessage = {
  id: string;
  clientName: string;
  title: string;
  body: string;
  date: string;
  status: "Pending" | "Sent" | "Reviewed";
};

type AdvisorMessageDraft = {
  clientName: string;
  title: string;
  body: string;
};

interface AdvisorMessagesScreenProps {
  advisorMessages: AdvisorMessage[];
  advisorMessageDraft: AdvisorMessageDraft;
  onBack: () => void;
  onUpdateDraft: <K extends keyof AdvisorMessageDraft>(
    key: K,
    value: AdvisorMessageDraft[K]
  ) => void;
  onSaveDraft: () => void;
  styles: ReturnType<typeof StyleSheet.create>;
}

export function AdvisorMessagesScreen({
  advisorMessages,
  advisorMessageDraft,
  onBack,
  onUpdateDraft,
  onSaveDraft,
  styles,
}: AdvisorMessagesScreenProps) {
  return (
      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
        <Text style={styles.panelTitle}>Secure advisor portal</Text>
          <Pressable onPress={onBack} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.panelSubtitle}>
          Protected draft space for advisor notes, client updates, and report handoff.
        </Text>
        <TextInput
          value={advisorMessageDraft.clientName}
          onChangeText={(value) => onUpdateDraft("clientName", value)}
          placeholder="Client name"
          placeholderTextColor="#7f90a8"
          style={styles.input}
        />
        <TextInput
          value={advisorMessageDraft.title}
          onChangeText={(value) => onUpdateDraft("title", value)}
          placeholder="Message title"
          placeholderTextColor="#7f90a8"
          style={styles.input}
        />
        <TextInput
          value={advisorMessageDraft.body}
          onChangeText={(value) => onUpdateDraft("body", value)}
          placeholder="Secure advisor message draft"
          placeholderTextColor="#7f90a8"
          multiline
          style={[styles.input, styles.messageInput]}
        />
        <View style={styles.inlineActions}>
          <Pressable style={styles.goldButton} onPress={onSaveDraft}>
            <Text style={styles.goldButtonText}>Save Draft</Text>
          </Pressable>
        </View>
        {advisorMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No advisor drafts yet</Text>
            <Text style={styles.emptyText}>
              Save secure client message drafts and keep them inside the advisor workspace.
            </Text>
          </View>
        ) : (
          advisorMessages.slice(0, 2).map((message) => (
            <View key={message.id} style={styles.analyticsListCard}>
              <Text style={styles.clientName}>{message.title}</Text>
              <Text style={styles.clientMeta}>
                {message.clientName} | {message.status} | {message.date}
              </Text>
              <Text style={styles.detailBlock}>{message.body}</Text>
            </View>
          ))
        )}
      </View>
  );
}
