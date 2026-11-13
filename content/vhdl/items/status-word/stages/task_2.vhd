library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        ready : in std_logic;
        fault : in std_logic;
        mode : in std_logic_vector(1 downto 0);
        status : out std_logic_vector(3 downto 0);
        fault_seen : out std_logic;
        mode_seen : out std_logic_vector(1 downto 0);
        service_mode : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    status <= ready & fault & mode;
    fault_seen <= '0';
    mode_seen <= "00";
    service_mode <= '0';
end architecture;
