import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    title: 'Family Sharing',
    description: 'Track expenses together with your family. Invite members with a simple code and see everyone\'s spending in one place.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'Visual Analytics',
    description: 'Understand your spending with beautiful charts. See monthly trends and category breakdowns at a glance.',
  },
  {
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: 'Mobile Friendly',
    description: 'Add expenses on the go from any device. Our responsive design works perfectly on phones, tablets, and desktops.',
  },
  {
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    title: 'Smart Categories',
    description: 'Organize expenses by category. Filter and search to find exactly what you\'re looking for.',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: 'Secure & Private',
    description: 'Your data is encrypted and secure. We use industry-standard security practices to protect your information.',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: 'Lightning Fast',
    description: 'Built on Cloudflare\'s edge network for instant responses. No loading spinners, just smooth performance.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 dark:from-primary-900 dark:to-primary-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 dark:bg-primary-900/80 backdrop-blur-md border-b border-cream-300 dark:border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-700 dark:bg-accent-400 rounded-lg flex items-center justify-center">
                <span className="text-accent-400 dark:text-primary-900 font-bold text-lg">$</span>
              </div>
              <span className="ml-2 text-xl font-bold text-primary-700 dark:text-cream-100">Expenses Manager</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-primary-600 dark:text-cream-200 hover:text-primary-700 dark:hover:text-cream-100 font-medium px-3 py-2 rounded-lg hover:bg-cream-200 dark:hover:bg-primary-800 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-accent-400 text-primary-800 font-medium px-4 py-2 rounded-lg hover:bg-accent-500 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-700 dark:text-cream-100 leading-tight">
            Track Family Expenses
            <span className="block text-primary-500 dark:text-accent-400">Together, Effortlessly</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-primary-600 dark:text-cream-200 max-w-2xl mx-auto">
            A simple, beautiful way to manage your family's finances. Add expenses,
            see where your money goes, and make smarter spending decisions together.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-accent-400 text-primary-800 font-semibold px-8 py-4 rounded-xl hover:bg-accent-500 transition-colors text-lg shadow-lg shadow-accent-400/25"
            >
              Start for Free
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center bg-white dark:bg-primary-800 text-primary-700 dark:text-cream-100 font-semibold px-8 py-4 rounded-xl hover:bg-cream-50 dark:hover:bg-primary-700 transition-colors text-lg border border-cream-300 dark:border-primary-600"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-primary-800 rounded-2xl shadow-2xl shadow-primary-700/10 dark:shadow-black/30 border border-cream-300 dark:border-primary-700 overflow-hidden">
            <div className="bg-primary-700 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-accent-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="p-6 sm:p-8 bg-cream-100 dark:bg-primary-900">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-primary-800 p-4 rounded-xl shadow-sm border border-cream-200 dark:border-primary-700">
                  <p className="text-sm text-primary-500 dark:text-cream-300">Total Expenses</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-cream-100">$4,285.50</p>
                </div>
                <div className="bg-white dark:bg-primary-800 p-4 rounded-xl shadow-sm border border-cream-200 dark:border-primary-700">
                  <p className="text-sm text-primary-500 dark:text-cream-300">This Month</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-cream-100">$1,234.00</p>
                </div>
                <div className="bg-white dark:bg-primary-800 p-4 rounded-xl shadow-sm border border-cream-200 dark:border-primary-700">
                  <p className="text-sm text-primary-500 dark:text-cream-300">Top Category</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-cream-100">Groceries</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-primary-800 p-4 rounded-xl shadow-sm border border-cream-200 dark:border-primary-700 h-40 flex items-center justify-center">
                  <div className="flex gap-1 items-end h-24">
                    {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                      <div
                        key={i}
                        className="w-6 sm:w-8 rounded-t"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i === 6 ? '#FAB95B' : '#547792'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="bg-white dark:bg-primary-800 p-4 rounded-xl shadow-sm border border-cream-200 dark:border-primary-700 h-40 flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full border-8"
                    style={{
                      borderTopColor: '#1A3263',
                      borderRightColor: '#547792',
                      borderBottomColor: '#FAB95B',
                      borderLeftColor: '#E8E2DB',
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-700 dark:text-cream-100">
              Everything you need to manage expenses
            </h2>
            <p className="mt-4 text-lg text-primary-500 dark:text-cream-300 max-w-2xl mx-auto">
              Simple yet powerful features designed for families who want to take control of their finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-primary-800 p-6 rounded-2xl border border-cream-300 dark:border-primary-700 hover:border-accent-400 dark:hover:border-accent-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-700 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-primary-700 dark:text-accent-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-primary-700 dark:text-cream-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-primary-500 dark:text-cream-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-primary-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-700 dark:text-cream-100">
              Get started in minutes
            </h2>
            <p className="mt-4 text-lg text-primary-500 dark:text-cream-300">
              Three simple steps to take control of your family finances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Create your account',
                description: 'Sign up for free and create your family group in seconds.',
              },
              {
                step: '2',
                title: 'Invite family members',
                description: 'Share your unique invite code so family members can join.',
              },
              {
                step: '3',
                title: 'Start tracking',
                description: 'Add expenses on the go and watch your insights grow.',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent-400 text-primary-800 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-primary-700 dark:text-cream-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-primary-500 dark:text-cream-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-700 dark:text-cream-100 mb-4">
            Built with modern technology
          </h2>
          <p className="text-primary-500 dark:text-cream-300 mb-8">
            Powered by cutting-edge tools for the best performance and developer experience
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'TypeScript', 'Tailwind CSS', 'Cloudflare Workers', 'Hono', 'D1 Database'].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-white dark:bg-primary-800 text-primary-600 dark:text-cream-200 rounded-full text-sm font-medium border border-cream-300 dark:border-primary-600"
                >
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary-700 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to take control of your finances?
            </h2>
            <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
              Join families who are already using Expenses Manager to track their spending and save more money.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center bg-accent-400 text-primary-800 font-semibold px-8 py-4 rounded-xl hover:bg-accent-500 transition-colors text-lg"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cream-300 dark:border-primary-700 bg-white dark:bg-primary-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-700 dark:bg-accent-400 rounded-lg flex items-center justify-center">
                <span className="text-accent-400 dark:text-primary-900 font-bold text-lg">$</span>
              </div>
              <span className="ml-2 text-lg font-bold text-primary-700 dark:text-cream-100">Expenses Manager</span>
            </div>
            <p className="text-primary-500 dark:text-cream-300 text-sm">
              Built by Chris Yaranga. Open source on{' '}
              <a
                href="https://github.com/CYaranga/expenses-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-500 hover:underline"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
