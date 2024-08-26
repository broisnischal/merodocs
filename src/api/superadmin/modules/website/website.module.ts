import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { HomeSectionModule } from './homesection/homesection.module';
import { HomeFeatureModule } from './homefeature/homefeature.module';
import { RFSectionModule } from './rfsection/rfsection.module';
import { ResidentFeatureModule } from './residentfeature/residentfeature.module';
import { NPCSectionModule } from './npcsection/npcsection.module';
import { CustomerReviewModule } from './customerreview/customerreview.module';
import { WhyUsSectionModule } from './whyussection/whyussection.module';
import { WhyUsCardModule } from './whyuscard/whyuscard.module';
import { BlogCategoryModule } from './blogcategory/blogcategory.module';
import { ResidentManagementModule } from './residentmanagement/residentmanagement.module';
import { ManagementStatisticModule } from './managementstatistic/managementstatistic.module';
import { AboutUsSectionModule } from './aboutussection/aboutussection.module';
import { FAQModule } from './faqs/faq.module';
import { BlogTagModule } from './blogtag/blogtag.module';
import { LegalComplianceModule } from './legalcompliance/legalcompliance.module';
import { TeamMemberModule } from './teammember/teammember.module';
import { VideoSectionModule } from './videosection/videosection.module';
import { ContactUsModule } from './contactus/contactus.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    HomeSectionModule,
    HomeFeatureModule,
    NPCSectionModule,
    WhyUsSectionModule,
    CustomerReviewModule,
    WhyUsSectionModule,
    WhyUsCardModule,
    BlogCategoryModule,
    BlogTagModule,
    BlogModule,
    ResidentManagementModule,
    RFSectionModule,
    ResidentFeatureModule,
    ManagementStatisticModule,
    AboutUsSectionModule,
    FAQModule,
    TeamMemberModule,
    LegalComplianceModule,
    VideoSectionModule,
    ContactUsModule,
    RouterModule.register([
      {
        path: 'superadmin/website',
        children: [
          HomeSectionModule,
          HomeFeatureModule,
          NPCSectionModule,
          WhyUsSectionModule,
          CustomerReviewModule,
          WhyUsSectionModule,
          WhyUsCardModule,
          BlogCategoryModule,
          BlogTagModule,
          BlogModule,
          ResidentManagementModule,
          RFSectionModule,
          ResidentFeatureModule,
          ManagementStatisticModule,
          AboutUsSectionModule,
          FAQModule,
          TeamMemberModule,
          LegalComplianceModule,
          VideoSectionModule,
          ContactUsModule,
        ],
      },
    ]),
  ],
})
export class WebsiteModule {}
