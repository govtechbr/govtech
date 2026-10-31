import Sidebar from './Sidebar'
import Topbar from './Topbar'
import GlobalSearch from './GlobalSearch'

export default function DashboardLayout({
  active,
  setActive,
  sidebarOpen,
  setSidebarOpen,
  settings,
  searchOpen,
  setSearchOpen,
  accountMenuOpen,
  setAccountMenuOpen,
  projectList,
  setSelectedProjectFromSearch,
  children,
}) {
  const navigateTo = (page) => {
    setActive(page)
    setSidebarOpen(false)
    setAccountMenuOpen(false)
  }

  return (
    <div className="dashboard-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        settings={settings}
      />

      <div className="main-area">
        

        {children}
      </div>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        projects={projectList}
        onNavigate={navigateTo}
        setSelectedProject={setSelectedProjectFromSearch}
      />
    </div>
  )
}