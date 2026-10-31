import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Text, View, ScrollView, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { api } from '../lib/api';
import PrimaryButton from '../components/PrimaryButton';
import RatingStars from '../components/RatingStars';
import { theme } from '../theme';

export default function GigDetailsScreen({ route, navigation }) {
  const { gig: initialGig } = route.params;
  const [gig, setGig] = useState(initialGig);
  const [isOwner, setIsOwner] = useState(false);
  const [myApplication, setMyApplication] = useState(null);
  const [proposalMessage, setProposalMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sellerRating, setSellerRating] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      const data = await api(`/api/gigs/${initialGig.id}`);
      if (data.gig) {
        setGig(data.gig);
        // Fetch seller rating
        if (data.gig.seller_id) {
          const revRes = await api(`/api/reviews/user/${data.gig.seller_id}`).catch(() => null);
          if (revRes && revRes.totalReviews > 0) {
            setSellerRating(revRes);
          }
        }
      }
      setIsOwner(data.isOwner || false);
      setMyApplication(data.myApplication || null);
    } catch (e) {
      console.warn('Could not refresh gig details:', e.message);
    } finally {
      setLoading(false);
    }
  }, [initialGig.id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  async function handleOpenChat() {
    try {
      const res = await api('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          gigId: gig.id,
          recipientId: gig.seller_id
        })
      });
      navigation.navigate('Chat', {
        conversationId: res.conversation.id,
        recipientName: gig.profiles?.full_name || 'Campus Peer',
        gigTitle: gig.title
      });
    } catch (e) {
      Alert.alert('Could not start chat', e.message);
    }
  }

  async function apply() {
    if (!proposalMessage.trim()) {
      return Alert.alert('Add a pitch', 'Please write a brief note about how you will deliver this gig.');
    }
    setBusy(true);
    try {
      const res = await api(`/api/gigs/${gig.id}/applications`, {
        method: 'POST',
        body: JSON.stringify({ message: proposalMessage.trim() })
      });
      setMyApplication(res.application);
      Alert.alert('Application Sent! 🚀', 'The gig owner will review your proposal.');
      fetchDetails();
    } catch (e) {
      Alert.alert('Could not apply', e.message);
    } finally {
      setBusy(false);
    }
  }

  const seller = gig.profiles || {};
  const sellerName = seller.full_name || 'Verified Campus Peer';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Main Details Card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
            <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 12 }}>{gig.category}</Text>
          </View>
          <Text style={{ color: theme.colors.muted, fontSize: 13, fontWeight: '600' }}>⚡ {gig.delivery_days} day(s) delivery</Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.colors.text, marginTop: 12 }}>{gig.title}</Text>
        <Text style={{ color: theme.colors.primaryDark, fontSize: 26, fontWeight: '900', marginTop: 10 }}>
          ₹{(gig.price_paise / 100).toFixed(0)}
        </Text>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }} />

        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>Description</Text>
        <Text style={{ color: '#4B455B', lineHeight: 22, fontSize: 15 }}>{gig.description}</Text>

        {/* Poster / Seller Profile Card */}
        <View style={{ backgroundColor: '#FAF9FE', borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.muted, marginBottom: 6 }}>
            {isOwner ? 'POSTED BY YOU' : 'POSTED BY'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{sellerName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text }}>{sellerName}</Text>
                {seller.course ? (
                  <Text style={{ fontSize: 12, color: theme.colors.muted }}>{seller.course} {seller.graduation_year ? `• Class of '${seller.graduation_year}` : ''}</Text>
                ) : null}
              </View>
            </View>

            {/* Rating badge if available */}
            {sellerRating ? (
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 14, marginRight: 2 }}>★</Text>
                  <Text style={{ fontWeight: '800', fontSize: 13, color: theme.colors.text }}>{sellerRating.averageRating}</Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.muted }}>({sellerRating.totalReviews} reviews)</Text>
              </View>
            ) : null}
          </View>

          {seller.bio ? (
            <Text style={{ fontSize: 13, color: theme.colors.muted, marginTop: 8, fontStyle: 'italic' }}>
              "{seller.bio}"
            </Text>
          ) : null}

          {/* Quick Chat Option if not owner */}
          {!isOwner && (
            <Pressable
              onPress={handleOpenChat}
              style={{
                marginTop: 12,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center'
              }}>
              <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 13 }}>💬 Ask Seller a Question</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Action Section */}
      <View style={{ marginTop: 20 }}>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : isOwner ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Manage Listing</Text>
            <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4, marginBottom: 14 }}>
              Review student proposals submitted for this gig and hire the right peer.
            </Text>
            <PrimaryButton
              title="Review Applicants"
              onPress={() => navigation.navigate('GigApplicants', { gigId: gig.id, gigTitle: gig.title })}
            />
          </View>
        ) : myApplication ? (
          <View style={{ backgroundColor: '#EBF9F1', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: '#A2E5BC' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>✅</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#136F41' }}>
                Application {myApplication.status ? myApplication.status.toUpperCase() : 'PENDING'}
              </Text>
            </View>
            <Text style={{ color: '#2B5E43', fontSize: 13, lineHeight: 18 }}>
              {myApplication.status === 'accepted'
                ? 'Your proposal was accepted! Check the My Work tab to track order progress.'
                : 'You have applied to this gig. You will be notified as soon as the poster reviews your proposal.'}
            </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 6 }}>
              Apply to this Gig
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 13, marginBottom: 14 }}>
              Introduce yourself, explain your relevant experience, and confirm your turnaround time.
            </Text>
            <TextInput
              value={proposalMessage}
              onChangeText={setProposalMessage}
              placeholder="e.g., I'm a 3rd year CS student experienced with Python/React. I can start immediately and deliver quality work..."
              placeholderTextColor={theme.colors.muted}
              multiline
              style={{
                backgroundColor: '#FAF9FE',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: 14,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
                fontSize: 14,
                color: theme.colors.text
              }}
            />
            <PrimaryButton title="Submit Proposal" onPress={apply} loading={busy} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
