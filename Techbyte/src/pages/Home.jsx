import React from 'react';
import HeroSlider from '../components/home/HeroSlider';
import BrandsSection from '../components/home/BrandsSection';
import AccessoriesBanner from '../components/home/AccessoriesBanner';
import FeaturedCollection from '../components/home/FeaturedCollection';
import FoldBanner from '../components/home/FoldBanner';

const Home = () => {
    return (
        <>
            <HeroSlider />
            <BrandsSection />
            <AccessoriesBanner />
            <FeaturedCollection />
            <FoldBanner />
        </>
    );
};

export default Home;
