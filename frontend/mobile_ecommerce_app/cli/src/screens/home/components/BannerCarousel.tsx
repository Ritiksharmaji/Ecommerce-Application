import React, {useState} from 'react';
import {
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {Text} from '@/components/ui/Typography';
import type {Banner} from '@/assets/data/banners';

const HORIZONTAL_PADDING = 32;
const GAP = 8;

interface BannerCarouselProps {
  banners: Banner[];
  onPressBanner: (banner: Banner) => void;
}

export default function BannerCarousel({banners, onPressBanner}: BannerCarouselProps) {
  const {width} = useWindowDimensions();
  const itemWidth = width - HORIZONTAL_PADDING;
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / (itemWidth + GAP)));

  return (
    <View className="mt-3">
      <ScrollView
        horizontal
        snapToInterval={itemWidth + GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {banners.map(banner => (
          <View
            key={banner.id}
            className="h-44 overflow-hidden rounded-2xl bg-border"
            style={{width: itemWidth, marginRight: GAP}}>
            <Image source={{uri: banner.image}} className="h-full w-full" />
            <View className="absolute inset-0 bg-black/35" />
            <View className="absolute bottom-3.5 left-3.5">
              <Text className="text-lg font-bold text-white">{banner.title}</Text>
              <Text className="text-[13px] text-white">{banner.subtitle}</Text>
              <TouchableOpacity
                onPress={() => onPressBanner(banner)}
                className="mt-2.5 self-start rounded-full bg-white px-3.5 py-1.5">
                <Text className="text-xs font-bold text-primary">Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="mt-2.5 flex-row justify-center">
        {banners.map((banner, index) => (
          <View
            key={banner.id}
            className={`mx-0.5 h-1.5 rounded-full ${
              index === activeIndex ? 'w-[18px] bg-primary' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
