import HeroSlider from './HeroSlider';

async function HeroSection() {
  return (
    <div className='w-full h-[45svh] md:min-h-[70svh] flex flex-col md:flex-row items-center justify-between px-6 md:px-12 lg:px-20 overflow-hidden max-w-[1540px] mx-auto py-10 md:py-16 relative text-white '>
      <HeroSlider />
    </div>
  )
}

export default HeroSection;