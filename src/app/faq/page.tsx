import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - PixelBridge',
};

export default function FAQPage() {
  const faqs = [
    {
      q: '在哪里找到我的 AppLovin Axon Pixel Key？',
      a: '登录 AppLovin MAX Dashboard，进入 Account → Keys，即可找到您的 Pixel Key。',
    },
    {
      q: '我需要手动添加代码到店铺吗？',
      a: '不需要。安装应用并输入 Pixel Key 后，追踪脚本会自动注入到您店铺的每个页面。',
    },
    {
      q: 'Pixel 追踪哪些事件？',
      a: '追踪浏览页面、查看商品、加购、发起结账、完成购买等关键转化事件，满足广告归因所需。',
    },
    {
      q: 'Pixel 会拖慢我的店铺吗？',
      a: '不会。Pixel 采用异步加载，对店铺页面加载速度零影响。',
    },
    {
      q: '3天免费试用结束后会怎样？',
      a: '订阅将自动转为 $1.99/月。您可以随时在 Shopline 应用管理页面取消。',
    },
    {
      q: '如何卸载应用？',
      a: '进入 Shopline 后台 → 应用 → 找到 PixelBridge → 卸载。您的所有数据将自动删除。',
    },
    {
      q: '能看到追踪了多少事件吗？',
      a: '可以。Dashboard 显示实时汇总统计，包括浏览量、加购数、结账数、购买数和总 GMV。',
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--brand-primary)] mb-8">Frequently Asked Questions</h1>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-400 pt-8 pb-4">
          PixelBridge v1.0 &middot; Powered by AppLovin Axon
        </div>
      </div>
    </div>
  );
}
