export type Campaign = {
 id:string;
 name:string;
 description:string;
 code:string;
 active:boolean;
};

export type CampaignMember = {
 campaignId:string;
 role:"MASTER"|"PLAYER";
}