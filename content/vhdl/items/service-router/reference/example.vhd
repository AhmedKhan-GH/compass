library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        data : in std_logic_vector(3 downto 0);
        destination : in std_logic_vector(1 downto 0);
        enabled : in std_logic;
        lane_0 : out std_logic_vector(3 downto 0);
        lane_1 : out std_logic_vector(3 downto 0);
        lane_2 : out std_logic_vector(3 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    lane_0 <= data when enabled = '1' and destination = "00" else (others => '0');
    lane_1 <= data when enabled = '1' and destination = "01" else (others => '0');
    lane_2 <= data when enabled = '1' and destination = "10" else (others => '0');
end architecture;
