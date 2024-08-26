import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ContactUsModule } from './modules/contactus/contactus.module';
import { ManagementStatisticModule } from './modules/managementstatistic/managementstatistic.module';
import { ResidentManagementModule } from './modules/residentmanagement/residentmanagement.module';
import { WhyUsSectionModule } from './modules/whyussection/whyussection.module';
import { HomePageModule } from './modules/homepage/homepage.module';
import { ResidentFeatureModule } from './modules/residentfeature/residentfeature.module';
import { FAQModule } from './modules/faqs/faq.module';
import { CustomerReviewModule } from './modules/customerreview/customerreview.module';
import { NPCSectionModule } from './modules/npcsection/npcsection.module';
import { VideoSectionModule } from './modules/videosection/videosection.module';
import { LegalComplianceModule } from './modules/legalcompliance/legalcompliance.module';
import { BlogModule } from './modules/blog/blog.module';
import { AboutUsSectionModule } from './modules/aboutussection/aboutussection.module';

@Module({
  imports: [
    ContactUsModule,
    ManagementStatisticModule,
    ResidentManagementModule,
    WhyUsSectionModule,
    HomePageModule,
    ResidentFeatureModule,
    FAQModule,
    CustomerReviewModule,
    NPCSectionModule,
    VideoSectionModule,
    LegalComplianceModule,
    BlogModule,
    AboutUsSectionModule,
    RouterModule.register([
      {
        path: 'website',
        children: [
          ContactUsModule,
          ManagementStatisticModule,
          ResidentManagementModule,
          WhyUsSectionModule,
          HomePageModule,
          ResidentFeatureModule,
          FAQModule,
          CustomerReviewModule,
          NPCSectionModule,
          VideoSectionModule,
          LegalComplianceModule,
          BlogModule,
          AboutUsSectionModule,
        ],
      },
    ]),
  ],
})
export class WebsiteModule {}
