import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View, Pressable } from 'react-native';
import { api } from '../lib/api';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';

const CATEGORIES = ['Design', 'Coding', 'Notes & Tutoring', 'Errands', 'Writing', 'Events'];

export default function CreateGigScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Design',
    priceRupees: '300',
    deliveryDays: '2'
  });
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));

  async function submit() {
    if (!form.title.trim() || form.title.trim().length < 5) {
      return Alert.alert('Invalid Title', 'Please enter a title with at least 5 characters.');
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      return Alert.alert('Invalid Description', 'Please describe your gig with at least 10 characters.');
    }
    const price = Number(form.priceRupees);
    if (!Number.isFinite(price) || price <= 0) {
      return Alert.alert('Invalid Price', 'Please enter a valid price in Rupees.');
    }
    const days = Number(form.deliveryDays);
    if (!Number.isInteger(days) || days < 1) {
      return Alert.alert('Invalid Delivery Time', 'Delivery time must be at least 1 day.');
    }

    setBusy(true);
    try {
      await api('/api/gigs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          priceRupees: price,
          deliveryDays: days
        })
      });
      Alert.alert('Gig Posted! 🚀', 'Students from your verified campus can now discover and apply for it.');
      setForm({ title: '', description: '', category: 'Design', priceRupees: '300', deliveryDays: '2' });
      navigation.navigate('Home');
    } catch (e) {
      Alert.alert('Could not post gig', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '900', color: theme.colors.text }}>Post a Campus Gig</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 4, marginBottom: 20, fontSize: 14 }}>
        Offer your skills or request assistance from verified peers on campus.
      </Text>

      {/* Title */}
      <Field
        label="Gig Title"
        value={form.title}
        onChangeText={v => update('title', v)}
        placeholder="e.g. Design fest poster, Debug React Native app, Calc II tutoring"
      />

      {/* Category selector */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
          {CATEGORIES.map(cat => {
            const isSelected = form.category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => update('category', cat)}
                style={{
                  backgroundColor: isSelected ? theme.colors.primary : '#fff',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border
                }}>
                <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Description */}
      <Field
        label="Detailed Description & Requirements"
        value={form.description}
        onChangeText={v => update('description', v)}
        placeholder="Specify scope, deliverables, software/tools used, reference links, and expectations..."
        multiline
      />

      {/* Price & Delivery Days */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Price (₹)"
            value={form.priceRupees}
            onChangeText={v => update('priceRupees', v)}
            placeholder="300"
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Delivery (Days)"
            value={form.deliveryDays}
            onChangeText={v => update('deliveryDays', v)}
            placeholder="2"
            keyboardType="numeric"
          />
        </View>
      </View>

      <PrimaryButton title="Publish Campus Gig" onPress={submit} loading={busy} />
      <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 14, textAlign: 'center' }}>
        🔒 Visible only to verified students from your campus.
      </Text>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '800', color: theme.colors.text, marginBottom: 7 }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.muted}
        style={{
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          padding: 14,
          minHeight: props.multiline ? 100 : 50,
          textAlignVertical: 'top',
          fontSize: 15,
          color: theme.colors.text
        }}
      />
    </View>
  );
}
