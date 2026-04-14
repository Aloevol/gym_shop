import React from "react";
import {getPrivacyAndPolicyServerSide} from "@/server/functions/admin.fun";

async function PrivacyAndReturnPage() {
    const conent = await getPrivacyAndPolicyServerSide().then( e=> e.data) as string;

  return (
    <section className="w-full min-h-screen bg-black pt-24 pb-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest mb-12 text-center">
            PRIVACY <span className="text-primary">&</span> POLICY
          </h1>
          <div
            className={"prose prose-invert prose-lg max-w-none bg-white/5 border border-white/10 p-10 rounded-[2rem]"}
            dangerouslySetInnerHTML={{__html: conent}}
          />
      </div>
    </section>
  );
}

export default PrivacyAndReturnPage;
